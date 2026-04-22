"""Gulp FastAPI application and HTTP routes (v2 — cupboard-native).

Endpoints:
    GET  /health           - liveness + slogan
    GET  /stats            - summary stats for the home hero
    GET  /items            - search / filter / sort / paginate listings
    GET  /items/types      - counts grouped by drinkware_type
    GET  /items/{id}       - single item with seller
    POST /items            - create a listing (auto-provisions a seller)
    POST /offers           - claim (omit price) or make a lower offer
    GET  /offers           - recent offers feed (for the ticker)
    POST /uploads/image    - upload a listing photo, returns a public URL
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from decimal import Decimal
from typing import AsyncIterator, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from . import models, schemas, uploads
from .config import settings
from .db import get_db


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """App lifespan hook.

    Schema creation is the exclusive responsibility of Alembic migrations
    (`alembic upgrade head`). We deliberately do NOT call
    `Base.metadata.create_all` here — a missing migration should fail loudly
    in CI/prod rather than be silently papered over at startup.
    """
    yield


app = FastAPI(
    title="Gulp API",
    description="Gulp — the marketplace for one too many.",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health")
def health():
    """Liveness probe with tongue firmly in cheek."""
    return {"status": "ok", "service": "gulp-api", "slogan": "One too many."}


@app.get("/stats", response_model=schemas.Stats)
def stats(db: Session = Depends(get_db)) -> schemas.Stats:
    """Summary metrics powering the homepage hero.

    All six figures come from a single round-trip using scalar subqueries so
    the home page doesn't pay for six sequential scans.
    """
    row = db.execute(
        select(
            func.count(models.Item.id).label("total_items"),
            func.coalesce(func.sum(models.Item.years_in_cupboard), 0).label(
                "cupboard_years"
            ),
            func.coalesce(func.avg(models.Item.shame_index), 0).label("avg_shame"),
            func.coalesce(func.sum(models.Item.price), 0).label("value_liberated"),
            select(func.count(models.Offer.id)).scalar_subquery().label(
                "total_offers"
            ),
        )
    ).one()

    return schemas.Stats(
        total_items=int(row.total_items),
        cupboard_years_liberated=int(row.cupboard_years),
        average_shame=round(float(row.avg_shame), 1),
        total_offers=int(row.total_offers),
        value_liberated_usd=round(float(row.value_liberated), 2),
    )


@app.get("/items", response_model=schemas.ItemPage)
def list_items(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="Search title/brand/colorway"),
    drinkware_type: Optional[str] = None,
    acquisition_source: Optional[str] = None,
    sort: str = Query(
        "trending",
        pattern="^(trending|price_asc|price_desc|shame_desc|newest|longest_shelf)$",
    ),
    limit: int = Query(60, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> schemas.ItemPage:
    """Return a paged, filtered, sorted slice of drinkware listings.

    Args:
        q: Free-text search across title, brand, and colorway.
        drinkware_type: Exact match on one of the drinkware enums.
        acquisition_source: Exact match on one of the acquisition enums.
        sort: Ordering key (`trending`, `price_asc`, `price_desc`,
            `shame_desc`, `newest`, `longest_shelf`).
        limit: Page size (1..200).
        offset: Rows to skip for pagination.
    """
    filters = []
    if q:
        like = f"%{q}%"
        filters.append(
            or_(
                models.Item.title.ilike(like),
                models.Item.brand.ilike(like),
                models.Item.colorway.ilike(like),
            )
        )
    if drinkware_type:
        filters.append(models.Item.drinkware_type == drinkware_type)
    if acquisition_source:
        filters.append(models.Item.acquisition_source == acquisition_source)

    base = select(models.Item)
    count_stmt = select(func.count(models.Item.id))
    for f in filters:
        base = base.where(f)
        count_stmt = count_stmt.where(f)

    stmt = base.options(joinedload(models.Item.seller))
    if sort == "price_asc":
        stmt = stmt.order_by(models.Item.price.asc(), models.Item.id.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(models.Item.price.desc(), models.Item.id.desc())
    elif sort == "shame_desc":
        stmt = stmt.order_by(
            models.Item.shame_index.desc(), models.Item.id.desc()
        )
    elif sort == "newest":
        stmt = stmt.order_by(models.Item.created_at.desc(), models.Item.id.desc())
    elif sort == "longest_shelf":
        stmt = stmt.order_by(
            models.Item.years_in_cupboard.desc(),
            models.Item.shame_index.desc(),
            models.Item.id.desc(),
        )
    else:  # trending = recent + a nudge from shame
        stmt = stmt.order_by(
            models.Item.created_at.desc(),
            models.Item.shame_index.desc(),
            models.Item.id.desc(),
        )

    total = int(db.scalar(count_stmt) or 0)
    stmt = stmt.limit(limit).offset(offset)
    items = list(db.scalars(stmt).unique())
    return schemas.ItemPage(items=items, total=total, limit=limit, offset=offset)


@app.get("/items/types")
def item_types(db: Session = Depends(get_db)):
    """Return counts grouped by drinkware_type, most populous first."""
    rows = db.execute(
        select(models.Item.drinkware_type, func.count(models.Item.id))
        .group_by(models.Item.drinkware_type)
        .order_by(func.count(models.Item.id).desc())
    ).all()
    return [{"drinkware_type": r[0], "count": r[1]} for r in rows]


@app.get("/items/{item_id}", response_model=schemas.ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)) -> models.Item:
    """Fetch a single listing by id or 404 if it already left the cupboard."""
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(
            status_code=404, detail="This cup is missing from its saucer."
        )
    return item


@app.post("/items", response_model=schemas.ItemOut, status_code=201)
def create_item(
    payload: schemas.ItemCreate, db: Session = Depends(get_db)
) -> models.Item:
    """Create a listing, auto-provisioning the seller by handle if needed."""
    seller = db.scalar(
        select(models.User).where(models.User.username == payload.seller_username)
    )
    if seller is None:
        seller = models.User(
            username=payload.seller_username,
            display_name=payload.seller_username.replace("_", " ").title(),
            verified=False,
        )
        db.add(seller)
        db.flush()

    data = payload.model_dump(exclude={"seller_username"})
    item = models.Item(**data, seller_id=seller.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.post("/offers", response_model=schemas.OfferOut, status_code=201)
def create_offer(
    payload: schemas.OfferCreate, db: Session = Depends(get_db)
) -> models.Offer:
    """Claim a cup at the asking price or make a lower offer.

    - If `price` is omitted, the buyer takes it home at asking:
      `kind="claim"`, `status="claimed"`, and the item is marked sold.
    - If `price` is provided and strictly less than asking, the buyer is
      proposing a negotiation: `kind="offer"`, `status="awaiting_seller"`.
    - If `price` is provided and >= asking, we 400 — that's a UX bug on the
      client, not a sneaky upgrade to a claim.

    Concurrency: we re-read the item with `SELECT ... FOR UPDATE` inside the
    request's transaction so two racing claims cannot both succeed.
    """
    # Row-lock the item so we have an authoritative read of `is_sold`.
    item = db.execute(
        select(models.Item)
        .where(models.Item.id == payload.item_id)
        .with_for_update()
    ).scalar_one_or_none()

    if item is None:
        raise HTTPException(
            status_code=404, detail="That cup already walked to someone else's shelf."
        )

    if item.is_sold:
        raise HTTPException(
            status_code=409,
            detail="This cup already found a cupboard. The circle continues.",
        )

    asking: Decimal = item.price

    if payload.price is None:
        price = asking
        kind = "claim"
        status_ = "claimed"
        item.is_sold = True
    else:
        proposed: Decimal = Decimal(payload.price)
        if proposed >= asking:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Offers must be below the asking price. "
                    "Tap 'Take it home' to claim at asking."
                ),
            )
        price = proposed
        kind = "offer"
        status_ = "awaiting_seller"

    offer = models.Offer(
        item_id=item.id,
        buyer_username=payload.buyer_username,
        price=price,
        kind=kind,
        status=status_,
        message=(payload.message or "").strip(),
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@app.get("/offers", response_model=list[schemas.OfferOut])
def list_offers(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[models.Offer]:
    """Return recent offers (newest first) for the live ticker."""
    stmt = (
        select(models.Offer)
        .order_by(models.Offer.created_at.desc(), models.Offer.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt))


@app.post("/uploads/image", response_model=schemas.UploadOut)
def upload_image(
    request: Request, file: UploadFile = File(...)
) -> schemas.UploadOut:
    """Upload a listing photo.

    Validates the file as an image, transcodes to WebP, caps the largest
    dimension at 1600px, and returns an absolute URL the browser can use in
    ``<img src>`` and Next.js ``<Image>``. The caller is expected to copy
    that URL into the listing's ``image_url`` when creating the item.
    """
    filename = uploads.save_uploaded_image(file, settings.upload_dir_path)
    base = str(request.base_url).rstrip("/")
    return schemas.UploadOut(url=f"{base}/uploads/{filename}")


# Mount static uploads LAST so specific routes above (e.g. POST /uploads/image)
# take precedence. The directory is created on demand so a fresh checkout /
# container image doesn't need to vendor the folder.
_upload_dir = settings.upload_dir_path
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_upload_dir)), name="uploads")
