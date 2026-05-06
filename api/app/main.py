"""Gulp FastAPI application and HTTP routes (v3 — authenticated).

Endpoints:
    GET    /health                - liveness + slogan
    GET    /events                - SSE activity stream (claims, offers, flips, new listings)
    GET    /stats                 - summary stats for the home hero
    POST   /auth/register         - create an account, set auth cookie
    POST   /auth/login            - verify credentials, set auth cookie
    POST   /auth/logout           - clear auth cookie
    GET    /auth/me               - current user (or 401)
    POST   /auth/change-password  - verify current password, set new, refresh cookie
    PATCH  /users/me              - update display name, email, avatar URL (auth)
    DELETE /users/me             - delete account + owned data (auth; confirm handle)
    GET    /items                 - search / filter / sort / paginate listings
    GET    /items/types           - counts grouped by drinkware_type
    GET    /items/{id}            - single item with seller
    POST   /items                 - create a listing (auth; seller = you)
    PATCH  /items/{id}            - edit a listing (auth; seller-only)
    GET    /items/{id}/offers     - offers on your listing (auth; seller-only)
    POST   /offers                - claim, bid, or propose a coin flip (auth)
    POST   /offers/{id}/view      - buyer marks a resolved flip as viewed (auth)
    GET    /offers                - recent offers feed for the ticker
    GET    /users/me/items        - listings owned by current user (auth)
    GET    /users/me/bids         - offers placed by current user (auth)
    GET    /users/{username}/items  - public listings by a seller
    POST   /uploads/image         - upload a listing photo, returns public URL
"""
from __future__ import annotations

import asyncio
import logging
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import datetime, timezone
from decimal import Decimal
from typing import AsyncIterator, Optional

from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from . import auth, models, schemas, uploads
from .events import hub as activity_hub
from .config import settings
from .db import SessionLocal, get_db
from .flip_buyer_view_reset import clear_resolved_flip_buyer_views


_log = logging.getLogger("gulp.api")


def _run_alembic_upgrade() -> None:
    """Run ``alembic upgrade head`` in-process for PaaS deployments."""
    from alembic import command
    from alembic.config import Config

    alembic_cfg = Config(
        str(Path(__file__).resolve().parent.parent / "alembic.ini")
    )
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """App lifespan hook.

    When ``settings.run_migrations_on_startup`` is enabled (PaaS like Railway),
    Alembic migrations run before the app accepts traffic.

    When ``settings.reset_flip_buyer_views_on_boot`` is enabled (local dev),
    resolved coin-flip rows have ``viewed_by_buyer_at`` cleared once at
    startup so **My bids** always shows the unseen-reveal state for testing.

    The activity hub attaches to the running loop so sync route handlers can
    publish SSE events via :func:`activity_hub.publish`.
    """
    if settings.run_migrations_on_startup and not os.environ.get(
        "GULP_RUNNING_TESTS"
    ):
        _log.info("Running Alembic migrations (run_migrations_on_startup=true)...")
        _run_alembic_upgrade()
        _log.info("Migrations complete.")

    activity_hub.attach_loop(asyncio.get_running_loop())
    if settings.reset_flip_buyer_views_on_boot and not os.environ.get(
        "GULP_RUNNING_TESTS"
    ):
        db = SessionLocal()
        try:
            n = clear_resolved_flip_buyer_views(db)
            db.commit()
            if n:
                _log.info(
                    "Cleared buyer view stamp on %d resolved flip offer(s) (boot).",
                    n,
                )
        finally:
            db.close()
    yield


API_DESCRIPTION = """
Gulp is a parody marketplace where drinkware finds a new cupboard. This is the
backend HTTP API consumed by the Next.js web client and, optionally, by anyone
who wants to poke at it directly.

## Authentication

Auth is handled by a short-lived JWT stored in an **HttpOnly cookie** named
`gulp_auth`, issued by `POST /auth/login` and `POST /auth/register`. All
authed endpoints read the cookie automatically — the browser attaches it on
every request when the client uses `credentials: "include"`.

Because the cookie is HttpOnly, the "Authorize" button in Swagger UI cannot
set it. To exercise authed endpoints from these docs, first call
`POST /auth/login` (from the **Auth** section below) — the browser will then
hold the cookie for subsequent calls.

## Demo accounts

Seeded with `python seed.py`. Password for all of them: `gulp1234`.

- `dad_of_four@gulp.market`
- `trendy_tessa@gulp.market`
- `brewery_bill@gulp.market`

## Error shape

Every non-2xx response uses FastAPI's standard `{ "detail": "<message>" }`
body. 401 is returned when the cookie is missing or invalid; 403 when the
caller is authenticated but not allowed (e.g. editing someone else's
listing); 409 when there's a race or duplicate constraint; 422 when the
payload fails schema validation.
"""

OPENAPI_TAGS = [
    {
        "name": "Meta",
        "description": "Liveness and aggregate stats. No authentication required.",
    },
    {
        "name": "Auth",
        "description": (
            "Register, log in, log out, and introspect the current user. "
            "All endpoints set or clear the `gulp_auth` HttpOnly cookie."
        ),
    },
    {
        "name": "Items",
        "description": (
            "Browse, create, and edit drinkware listings. Reads are public; "
            "creates and edits require an authenticated seller."
        ),
    },
    {
        "name": "Offers",
        "description": (
            "Place claims (at asking price) or bids (below asking). Creating "
            "an offer requires auth; the public offers feed is open."
        ),
    },
    {
        "name": "Users",
        "description": (
            "User-scoped dashboards (`/users/me/*`) and the public profile "
            "page for a given seller handle."
        ),
    },
    {
        "name": "Uploads",
        "description": "Multipart image upload for listing photos (auth required).",
    },
]


app = FastAPI(
    title="Gulp API",
    description=API_DESCRIPTION,
    version="0.4.0",
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
    contact={"name": "Gulp Marketplace"},
    license_info={"name": "Parody, for educational use"},
    swagger_ui_parameters={
        # Keep the endpoint list collapsed by default so the tag groups
        # stay legible when the API grows.
        "docExpansion": "list",
        "defaultModelsExpandDepth": 1,
        "persistAuthorization": True,
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def custom_openapi() -> dict:
    """Generate (and cache) the OpenAPI schema with a cookie security scheme.

    FastAPI doesn't surface cookie auth via its dependency system the way it
    does for HTTP Bearer or API keys, so we patch the spec directly:

    1. Declare a `cookieAuth` security scheme keyed on the `gulp_auth` cookie.
    2. Attach it as a hint on every authed route so Swagger UI renders the
       padlock icon and ReDoc groups the endpoint under the scheme.

    The authentication itself is still enforced by the `get_current_user`
    dependency at request time — this only affects the published documentation.
    """
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        contact=app.contact,
        license_info=app.license_info,
    )

    schema.setdefault("components", {}).setdefault("securitySchemes", {})[
        "cookieAuth"
    ] = {
        "type": "apiKey",
        "in": "cookie",
        "name": settings.cookie_name,
        "description": (
            "Session cookie issued by `POST /auth/login` or "
            "`POST /auth/register`. Marked `HttpOnly` so JavaScript cannot "
            "read it; Swagger UI's Authorize button cannot set it either — "
            "log in through the Auth section to exercise protected routes."
        ),
    }

    # Routes that go through `get_current_user` are the ones that require the
    # cookie. Listing them here keeps the OpenAPI metadata honest without
    # trying to reverse-engineer the dependency graph.
    authed_paths = {
        ("post", "/items"),
        ("patch", "/items/{item_id}"),
        ("get", "/items/{item_id}/offers"),
        ("post", "/offers"),
        ("post", "/offers/{offer_id}/flip"),
        ("post", "/offers/{offer_id}/reject"),
        ("post", "/offers/{offer_id}/view"),
        ("get", "/users/me/items"),
        ("get", "/users/me/bids"),
        ("patch", "/users/me"),
        ("delete", "/users/me"),
        ("post", "/uploads/image"),
        ("get", "/auth/me"),
        ("post", "/auth/change-password"),
    }
    for path, path_item in schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if (method, path) in authed_paths:
                operation.setdefault("security", []).append({"cookieAuth": []})

    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi


# ---------------------------------------------------------------------------
# Health + stats
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    tags=["Meta"],
    summary="Liveness probe",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "service": "gulp-api",
                        "slogan": "One too many.",
                    }
                }
            }
        }
    },
)
def health():
    """Liveness probe with tongue firmly in cheek."""
    return {"status": "ok", "service": "gulp-api", "slogan": "One too many."}


@app.get(
    "/events",
    tags=["Meta"],
    summary="Server-Sent Events stream of marketplace activity",
)
async def activity_events() -> StreamingResponse:
    """Public SSE channel: JSON payloads when claims, offers, flips, or new
    listings occur. Comment lines keep proxies from closing idle connections.
    """

    async def event_gen() -> AsyncIterator[bytes]:
        queue = activity_hub.subscribe()
        try:
            yield b": keepalive\n\n"
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {payload}\n\n".encode("utf-8")
                except asyncio.TimeoutError:
                    yield b": keepalive\n\n"
        finally:
            activity_hub.unsubscribe(queue)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get(
    "/stats",
    response_model=schemas.Stats,
    tags=["Meta"],
    summary="Homepage aggregate stats",
)
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


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

_INVALID_CREDS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password."
)


_UNAUTHORIZED_RESPONSE = {
    401: {
        "description": "Not authenticated or session expired.",
        "content": {"application/json": {"example": {"detail": "Not authenticated."}}},
    }
}
_FORBIDDEN_RESPONSE = {
    403: {
        "description": "Authenticated, but not allowed to perform this action.",
        "content": {
            "application/json": {
                "example": {"detail": "You can only edit your own listings."}
            }
        },
    }
}
_NOT_FOUND_RESPONSE = {
    404: {
        "description": "Item or user not found.",
        "content": {
            "application/json": {
                "example": {"detail": "This cup is missing from its saucer."}
            }
        },
    }
}


@app.post(
    "/auth/register",
    response_model=schemas.MeOut,
    status_code=201,
    tags=["Auth"],
    summary="Create an account",
    responses={
        409: {
            "description": "Email or username already in use.",
            "content": {
                "application/json": {
                    "example": {"detail": "That email or handle is already taken."}
                }
            },
        }
    },
)
def register(
    payload: schemas.RegisterIn,
    response: Response,
    db: Session = Depends(get_db),
) -> models.User:
    """Create an account and sign the caller in.

    Emits a 409 if the email or username is already taken. On success, the
    auth cookie is set on ``response`` and the newly created ``MeOut`` is
    returned.
    """
    user = models.User(
        email=payload.email.lower(),
        username=payload.username,
        display_name=payload.display_name.strip(),
        password_hash=auth.hash_password(payload.password),
        verified=False,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That email or handle is already taken.",
        )
    db.refresh(user)
    auth.set_auth_cookie(response, auth.create_access_token(user.id))
    return user


@app.post(
    "/auth/login",
    response_model=schemas.MeOut,
    tags=["Auth"],
    summary="Log in with email + password",
    responses={
        401: {
            "description": "Invalid credentials.",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid email or password."}
                }
            },
        }
    },
)
def login(
    payload: schemas.LoginIn,
    response: Response,
    db: Session = Depends(get_db),
) -> models.User:
    """Verify credentials and issue the auth cookie.

    A single neutral 401 is used for both "unknown email" and "wrong
    password" to avoid enumerating accounts.
    """
    user = db.scalar(
        select(models.User).where(models.User.email == payload.email.lower())
    )
    if user is None or not auth.verify_password(payload.password, user.password_hash):
        raise _INVALID_CREDS
    auth.set_auth_cookie(response, auth.create_access_token(user.id))
    return user


@app.post(
    "/auth/logout",
    status_code=204,
    tags=["Auth"],
    summary="Clear the auth cookie",
)
def logout(response: Response) -> Response:
    """Clear the auth cookie. Safe to call when already logged out."""
    auth.clear_auth_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@app.get(
    "/auth/me",
    response_model=schemas.MeOut,
    tags=["Auth"],
    summary="Current authenticated user",
    responses=_UNAUTHORIZED_RESPONSE,
)
def me(user: models.User = Depends(auth.get_current_user)) -> models.User:
    """Return the currently authenticated user or 401."""
    return user


@app.post(
    "/auth/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Auth"],
    summary="Change password (refreshes session cookie)",
    responses={
        401: {
            "description": "Current password incorrect.",
            "content": {
                "application/json": {
                    "example": {"detail": "Current password is incorrect."}
                }
            },
        }
    },
)
def change_password(
    payload: schemas.ChangePasswordIn,
    response: Response,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> Response:
    """Verify the caller's current password, replace the hash, and re-issue JWT.

    The new session cookie uses the same TTL as a fresh login so password
    changes do not shorten the remaining session unexpectedly.
    """
    if not auth.verify_password(
        payload.current_password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )
    current_user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    auth.set_auth_cookie(response, auth.create_access_token(current_user.id))
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@app.patch(
    "/users/me",
    response_model=schemas.MeOut,
    tags=["Users"],
    summary="Update your profile (display name, email, avatar)",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        409: {
            "description": "Email already registered.",
            "content": {
                "application/json": {
                    "example": {"detail": "That email is already taken."}
                }
            },
        },
    },
)
def update_me(
    payload: schemas.MeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.User:
    """Apply partial updates to the authenticated user's profile fields.

    Only keys present in the JSON body are written. Email is normalized to
    lowercase before the unique constraint check.
    """
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return current_user
    if "email" in changes and changes["email"] is not None:
        changes["email"] = str(changes["email"]).lower()
    for key, value in changes.items():
        setattr(current_user, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That email is already taken.",
        )
    db.refresh(current_user)
    return current_user


@app.delete(
    "/users/me",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Users"],
    summary="Delete your account and all owned listings/offers",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        400: {
            "description": "Confirmation handle did not match.",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Confirmation handle does not match your account."
                    }
                }
            },
        },
    },
)
def delete_me(
    payload: schemas.DeleteMeIn,
    response: Response,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> Response:
    """Permanently remove the caller's account and related rows.

    Deletes, in order: offers on listings the user sells, offers where the
    user is the buyer, listings owned by the user, then the user row.
    Requires repeating the exact public ``username`` in the JSON body.
    """
    if payload.confirm_username != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation handle does not match your account.",
        )
    seller_id = current_user.id
    item_ids_subq = select(models.Item.id).where(models.Item.seller_id == seller_id)
    db.execute(delete(models.Offer).where(models.Offer.item_id.in_(item_ids_subq)))
    db.execute(delete(models.Offer).where(models.Offer.buyer_id == seller_id))
    db.execute(delete(models.Item).where(models.Item.seller_id == seller_id))
    db.delete(current_user)
    db.commit()
    auth.clear_auth_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


# ---------------------------------------------------------------------------
# Items — public reads
# ---------------------------------------------------------------------------

@app.get(
    "/items",
    response_model=schemas.ItemPage,
    tags=["Items"],
    summary="Search / filter / sort listings",
)
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


@app.get(
    "/items/types",
    tags=["Items"],
    summary="Listing counts grouped by drinkware type",
)
def item_types(db: Session = Depends(get_db)):
    """Return counts grouped by drinkware_type, most populous first."""
    rows = db.execute(
        select(models.Item.drinkware_type, func.count(models.Item.id))
        .group_by(models.Item.drinkware_type)
        .order_by(func.count(models.Item.id).desc())
    ).all()
    return [{"drinkware_type": r[0], "count": r[1]} for r in rows]


@app.get(
    "/items/{item_id}",
    response_model=schemas.ItemOut,
    tags=["Items"],
    summary="Fetch a single listing by id",
    responses=_NOT_FOUND_RESPONSE,
)
def get_item(item_id: int, db: Session = Depends(get_db)) -> models.Item:
    """Fetch a single listing by id or 404 if it already left the cupboard."""
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(
            status_code=404, detail="This cup is missing from its saucer."
        )
    return item


# ---------------------------------------------------------------------------
# Items — authed writes
# ---------------------------------------------------------------------------

@app.post(
    "/items",
    response_model=schemas.ItemOut,
    status_code=201,
    tags=["Items"],
    summary="Create a listing as the authenticated user",
    responses={**_UNAUTHORIZED_RESPONSE},
)
def create_item(
    payload: schemas.ItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.Item:
    """Create a listing owned by the currently authenticated user."""
    data = payload.model_dump()
    item = models.Item(**data, seller_id=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    try:
        activity_hub.publish(
            {
                "kind": "new_listing",
                "text": f"☕ NEW · {item.brand} {item.title.split('—')[0].strip()[:48]}",
            }
        )
    except Exception:
        pass
    return item


@app.patch(
    "/items/{item_id}",
    response_model=schemas.ItemOut,
    tags=["Items"],
    summary="Edit a listing you own",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        **_FORBIDDEN_RESPONSE,
        **_NOT_FOUND_RESPONSE,
        409: {
            "description": "Listing already sold; edits are blocked.",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Rehomed cups can't be edited after the match."
                    }
                }
            },
        },
    },
)
def update_item(
    item_id: int,
    payload: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.Item:
    """Edit fields on a listing you own.

    - 404 if the item does not exist.
    - 403 if the caller is not the seller.
    - 409 if the item is already sold — rehomed cups are immutable.
    """
    item = db.get(models.Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="This cup is missing from its saucer.")
    if item.seller_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only edit your own listings."
        )
    if item.is_sold:
        raise HTTPException(
            status_code=409, detail="Rehomed cups can't be edited after the match."
        )

    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@app.get(
    "/items/{item_id}/offers",
    response_model=list[schemas.OfferOut],
    tags=["Items"],
    summary="Offers on a listing (seller-only)",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        **_FORBIDDEN_RESPONSE,
        **_NOT_FOUND_RESPONSE,
    },
)
def list_item_offers(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> list[models.Offer]:
    """Offers on a given listing — visible only to that listing's seller."""
    item = db.get(models.Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="This cup is missing from its saucer.")
    if item.seller_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the seller can see offers on this listing."
        )
    stmt = (
        select(models.Offer)
        .where(models.Offer.item_id == item_id)
        .options(joinedload(models.Offer.buyer))
        .order_by(models.Offer.created_at.desc(), models.Offer.id.desc())
    )
    return list(db.scalars(stmt).unique())


# ---------------------------------------------------------------------------
# Offers
# ---------------------------------------------------------------------------

@app.post(
    "/offers",
    response_model=schemas.OfferOut,
    status_code=201,
    tags=["Offers"],
    summary="Claim at asking, bid below asking, or propose a coin flip",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        **_NOT_FOUND_RESPONSE,
        400: {
            "description": "Invalid claim / offer / flip payload.",
            "content": {
                "application/json": {
                    "example": {
                        "detail": (
                            "Offers must be below the asking price. Tap 'Take "
                            "it home' to claim at asking."
                        )
                    }
                }
            },
        },
        403: {
            "description": "Caller is the seller of this listing.",
            "content": {
                "application/json": {
                    "example": {"detail": "You can't bid on your own listing."}
                }
            },
        },
        409: {
            "description": "Listing already sold.",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "This cup already found a cupboard. The circle continues."
                    }
                }
            },
        },
    },
)
def create_offer(
    payload: schemas.OfferCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.Offer:
    """Claim at asking, lower-offer, or propose a coin flip on a listing.

    Three shapes are multiplexed onto a single row, disambiguated by which
    price fields the caller sent:

    - **Claim** (omit ``price`` / ``low_price`` / ``high_price``): buyer
      takes the cup at the asking price. Row: ``kind="claim"``,
      ``status="claimed"``; the item is marked sold in the same transaction.
    - **Lower offer** (``price`` below asking): buyer proposes a number the
      seller can accept later. Row: ``kind="offer"``,
      ``status="awaiting_seller"``; item remains listed.
    - **Coin flip** (both ``low_price`` and ``high_price``): buyer proposes
      a 50/50 gamble — ``low_price`` is paid on win, ``high_price`` on lose.
      The server enforces ``low_price < asking < high_price`` so the flip is
      a real gamble. Row: ``kind="flip"``, ``status="awaiting_seller"``,
      ``price=(low+high)/2`` as a placeholder expected value.

    Guards:

    - Sellers cannot bid on their own listing (403).
    - Sold items reject new claims/offers/flips with 409.
    - Mixing ``price`` with flip fields, sending only one of low/high, or
      crossing the asking-price constraint all 400.

    Concurrency: we re-read the item with ``SELECT ... FOR UPDATE`` inside
    the request's transaction so two racing claims/flips cannot both succeed.
    """
    item = db.execute(
        select(models.Item)
        .where(models.Item.id == payload.item_id)
        .with_for_update()
    ).scalar_one_or_none()

    if item is None:
        raise HTTPException(
            status_code=404, detail="That cup already walked to someone else's shelf."
        )

    if item.seller_id == current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can't bid on your own listing.",
        )

    if item.is_sold:
        raise HTTPException(
            status_code=409,
            detail="This cup already found a cupboard. The circle continues.",
        )

    asking: Decimal = item.price
    is_flip = payload.low_price is not None or payload.high_price is not None

    if is_flip:
        if payload.price is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Pick one — a number for a straight offer, or a low/high "
                    "pair for a coin flip. Not both."
                ),
            )
        if payload.low_price is None or payload.high_price is None:
            raise HTTPException(
                status_code=400,
                detail="A coin flip needs both a low and a high price.",
            )
        low = Decimal(payload.low_price)
        high = Decimal(payload.high_price)
        if not (low < asking < high):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Flip prices must straddle the asking price: "
                    "low_price < asking < high_price. No free lunches, no free "
                    "losses."
                ),
            )
        price = (low + high) / Decimal(2)
        kind = "flip"
        status_ = "awaiting_seller"
        low_price: Optional[Decimal] = low
        high_price: Optional[Decimal] = high
    elif payload.price is None:
        price = asking
        kind = "claim"
        status_ = "claimed"
        item.is_sold = True
        low_price = None
        high_price = None
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
        low_price = None
        high_price = None

    offer = models.Offer(
        item_id=item.id,
        buyer_id=current_user.id,
        price=price,
        kind=kind,
        status=status_,
        message=(payload.message or "").strip(),
        low_price=low_price,
        high_price=high_price,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    # Eager-load buyer so the response_model serialization sees it.
    db.refresh(offer, attribute_names=["buyer"])
    try:
        buyer_name = (
            offer.buyer.username
            if offer.buyer is not None
            else current_user.username
        )
        if kind == "claim":
            activity_hub.publish(
                {
                    "kind": "claim",
                    "text": f"🎉 @{buyer_name} rehomed a cup",
                }
            )
        elif kind == "offer":
            activity_hub.publish(
                {
                    "kind": "offer",
                    "text": f"💬 @{buyer_name} lobbed an offer",
                }
            )
        else:
            activity_hub.publish(
                {
                    "kind": "flip",
                    "text": f"🪙 @{buyer_name} proposed a coin flip",
                }
            )
    except Exception:
        pass
    return offer


def _load_pending_offer_for_seller(
    db: Session, offer_id: int, seller: models.User
) -> models.Offer:
    """Fetch a pending offer owned by ``seller`` (as item seller), or raise.

    Used by the seller-side resolution endpoints. Locks the offer row so two
    concurrent accept/reject requests cannot both succeed. Raises:

    - 404 if the offer does not exist.
    - 403 if the caller is not the seller of the offer's item.
    - 409 if the offer has already been resolved (not ``awaiting_seller``).

    Concurrency note: ``with_for_update(of=models.Offer)`` scopes the row
    lock to the ``offers`` table only. This matters on Postgres, which
    refuses ``FOR UPDATE`` on the nullable side of a ``LEFT OUTER JOIN`` —
    and ``joinedload`` always renders as an outer join. The lock still
    protects the mutation target; the ``item`` row has its own separate
    ``FOR UPDATE`` inside :func:`resolve_flip` when we flip ``is_sold``.
    """
    offer = db.execute(
        select(models.Offer)
        .where(models.Offer.id == offer_id)
        .options(joinedload(models.Offer.item), joinedload(models.Offer.buyer))
        .with_for_update(of=models.Offer)
    ).scalar_one_or_none()

    if offer is None:
        raise HTTPException(status_code=404, detail="No such offer.")
    if offer.item.seller_id != seller.id:
        raise HTTPException(
            status_code=403,
            detail="Only the seller can act on offers for this listing.",
        )
    if offer.status != "awaiting_seller":
        raise HTTPException(
            status_code=409,
            detail="This offer is no longer pending.",
        )
    return offer


@app.post(
    "/offers/{offer_id}/flip",
    response_model=schemas.OfferOut,
    tags=["Offers"],
    summary="Resolve a pending coin-flip offer (seller-only)",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        **_FORBIDDEN_RESPONSE,
        **_NOT_FOUND_RESPONSE,
        400: {
            "description": "Offer is not a coin flip.",
            "content": {
                "application/json": {
                    "example": {"detail": "This offer isn't a coin flip."}
                }
            },
        },
        409: {
            "description": "Item already sold or offer no longer pending.",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "This cup already found a cupboard. The circle continues."
                    }
                }
            },
        },
    },
)
def resolve_flip(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.Offer:
    """Flip the coin and lock in the outcome, from the seller's side.

    Flow, inside a single transaction:

    1. Lock the pending flip offer and verify caller is the item's seller.
    2. Lock the item via ``SELECT ... FOR UPDATE`` and verify it is still
       unsold — if not, 409.
    3. Draw a fair coin with :func:`secrets.randbelow` (``win`` = buyer pays
       ``low_price``, ``lose`` = buyer pays ``high_price``).
    4. Persist the outcome: set ``flip_outcome``, overwrite ``price`` with the
       settlement amount, advance status to ``flipped_won`` / ``flipped_lost``,
       and mark the item sold.

    The returned :class:`OfferOut` includes ``flip_outcome`` and the final
    ``price`` so the UI can render the reveal without another round trip.
    """
    offer = _load_pending_offer_for_seller(db, offer_id, current_user)

    if offer.kind != "flip":
        raise HTTPException(
            status_code=400, detail="This offer isn't a coin flip."
        )
    if offer.low_price is None or offer.high_price is None:
        # Defensive: the DB CHECK guarantees both are set on flip rows, but a
        # broken migration history shouldn't crash with an AttributeError.
        raise HTTPException(
            status_code=409, detail="Flip offer is missing its candidate prices."
        )

    item = db.execute(
        select(models.Item)
        .where(models.Item.id == offer.item_id)
        .with_for_update()
    ).scalar_one()
    if item.is_sold:
        raise HTTPException(
            status_code=409,
            detail="This cup already found a cupboard. The circle continues.",
        )

    # Fair coin: secrets.randbelow avoids the subtle modulo bias of % 2 on
    # platforms where the PRNG returns a bounded range.
    buyer_won = secrets.randbelow(2) == 0
    if buyer_won:
        offer.flip_outcome = "win"
        offer.status = "flipped_won"
        offer.price = Decimal(offer.low_price)
    else:
        offer.flip_outcome = "lose"
        offer.status = "flipped_lost"
        offer.price = Decimal(offer.high_price)

    item.is_sold = True
    db.commit()
    db.refresh(offer)
    db.refresh(offer, attribute_names=["buyer"])
    try:
        buyer_name = offer.buyer.username if offer.buyer is not None else "buyer"
        outcome = "won" if buyer_won else "lost"
        activity_hub.publish(
            {
                "kind": "flip_resolved",
                "text": f"🪙 @{buyer_name} {outcome} the flip — cup rehomed",
            }
        )
    except Exception:
        pass
    return offer


@app.post(
    "/offers/{offer_id}/reject",
    response_model=schemas.OfferOut,
    tags=["Offers"],
    summary="Reject a pending offer or coin-flip proposal (seller-only)",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        **_FORBIDDEN_RESPONSE,
        **_NOT_FOUND_RESPONSE,
        409: {
            "description": "Offer already resolved.",
            "content": {
                "application/json": {
                    "example": {"detail": "This offer is no longer pending."}
                }
            },
        },
    },
)
def reject_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.Offer:
    """Mark a pending offer / flip as ``rejected`` from the seller's side.

    Works for both ``kind='offer'`` and ``kind='flip'``. A claim is already
    terminal so it cannot be rejected (it would be returned 409 by
    :func:`_load_pending_offer_for_seller` because its status is ``claimed``).
    """
    offer = _load_pending_offer_for_seller(db, offer_id, current_user)
    offer.status = "rejected"
    db.commit()
    db.refresh(offer)
    db.refresh(offer, attribute_names=["buyer"])
    return offer


@app.post(
    "/offers/{offer_id}/view",
    response_model=schemas.OfferOut,
    tags=["Offers"],
    summary="Mark a resolved coin flip as viewed by the buyer",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        400: {
            "description": "Not a resolved flip.",
            "content": {
                "application/json": {
                    "example": {"detail": "This flip is not resolved yet."}
                }
            },
        },
        **_FORBIDDEN_RESPONSE,
        **_NOT_FOUND_RESPONSE,
    },
)
def mark_flip_viewed(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.Offer:
    """Record that the buyer opened the post-flip reveal UI (idempotent).

    Only the offer's ``buyer_id`` may call this. The offer must be
    ``kind='flip'`` with ``status`` in ``flipped_won`` / ``flipped_lost``.
    The first successful call sets ``viewed_by_buyer_at`` to the current UTC
    time; subsequent calls return the same row without changing the
    timestamp.

    - 404 if the offer id does not exist.
    - 403 if the caller is not the buyer.
    - 400 if the offer is not a flip or the flip is not yet resolved.
    """
    offer = db.get(models.Offer, offer_id)
    if offer is None:
        raise HTTPException(status_code=404, detail="No such offer.")
    if offer.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the buyer can mark this offer as viewed.",
        )
    if offer.kind != "flip":
        raise HTTPException(
            status_code=400,
            detail="Only resolved coin flips can be marked as viewed.",
        )
    if offer.status not in ("flipped_won", "flipped_lost"):
        raise HTTPException(
            status_code=400,
            detail="This flip is not resolved yet.",
        )
    if offer.viewed_by_buyer_at is None:
        offer.viewed_by_buyer_at = datetime.now(timezone.utc)
        db.commit()
    db.refresh(offer)
    db.refresh(offer, attribute_names=["buyer"])
    return offer


@app.get(
    "/offers",
    response_model=list[schemas.OfferOut],
    tags=["Offers"],
    summary="Recent offers feed (public)",
)
def list_offers(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[models.Offer]:
    """Return recent offers (newest first) for the live ticker."""
    stmt = (
        select(models.Offer)
        .options(joinedload(models.Offer.buyer))
        .order_by(models.Offer.created_at.desc(), models.Offer.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt).unique())


# ---------------------------------------------------------------------------
# User-scoped dashboards
# ---------------------------------------------------------------------------

@app.get(
    "/users/me/items",
    response_model=list[schemas.ItemOut],
    tags=["Users"],
    summary="My listings (seller dashboard)",
    responses=_UNAUTHORIZED_RESPONSE,
)
def my_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> list[models.Item]:
    """All listings owned by the currently authenticated user."""
    stmt = (
        select(models.Item)
        .where(models.Item.seller_id == current_user.id)
        .options(joinedload(models.Item.seller))
        .order_by(models.Item.created_at.desc(), models.Item.id.desc())
    )
    return list(db.scalars(stmt).unique())


@app.get(
    "/users/me/bids",
    response_model=list[schemas.OfferWithItem],
    tags=["Users"],
    summary="My bids (buyer dashboard)",
    responses=_UNAUTHORIZED_RESPONSE,
)
def my_bids(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> list[models.Offer]:
    """All offers placed by the currently authenticated user, with items."""
    stmt = (
        select(models.Offer)
        .where(models.Offer.buyer_id == current_user.id)
        .options(
            joinedload(models.Offer.buyer),
            joinedload(models.Offer.item).joinedload(models.Item.seller),
        )
        .order_by(models.Offer.created_at.desc(), models.Offer.id.desc())
    )
    return list(db.scalars(stmt).unique())


@app.get(
    "/users/{username}/items",
    response_model=list[schemas.ItemOut],
    tags=["Users"],
    summary="Public listings for a seller handle",
    responses={
        404: {
            "description": "No seller with that handle.",
            "content": {
                "application/json": {
                    "example": {"detail": "No seller with that handle."}
                }
            },
        }
    },
)
def seller_items(
    username: str, db: Session = Depends(get_db)
) -> list[models.Item]:
    """Public list of all active listings posted by a given seller handle."""
    seller = db.scalar(select(models.User).where(models.User.username == username))
    if seller is None:
        raise HTTPException(status_code=404, detail="No seller with that handle.")
    stmt = (
        select(models.Item)
        .where(models.Item.seller_id == seller.id)
        .options(joinedload(models.Item.seller))
        .order_by(models.Item.created_at.desc(), models.Item.id.desc())
    )
    return list(db.scalars(stmt).unique())


# ---------------------------------------------------------------------------
# Uploads
# ---------------------------------------------------------------------------

@app.post(
    "/uploads/image",
    response_model=schemas.UploadOut,
    tags=["Uploads"],
    summary="Upload a listing photo",
    responses={
        **_UNAUTHORIZED_RESPONSE,
        400: {
            "description": "Unsupported or malformed image file.",
            "content": {
                "application/json": {
                    "example": {"detail": "That file doesn't look like an image."}
                }
            },
        },
    },
)
def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
) -> schemas.UploadOut:
    """Upload a listing photo (auth required).

    Validates the file as an image, transcodes to WebP, caps the largest
    dimension at 1600px, and returns an absolute URL the browser can use
    in ``<img src>`` and Next.js ``<Image>``. The caller is expected to
    copy that URL into the listing's ``image_url`` when creating the item.
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
