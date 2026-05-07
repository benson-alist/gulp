"""Pydantic v2 request/response schemas for Gulp.

Currency fields are modelled as `Decimal` to avoid float drift but are
serialized as JSON numbers (not strings) via `PlainSerializer` so the
public wire format stays ergonomic for JavaScript clients.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    PlainSerializer,
    field_validator,
)

from .models import (
    ACQUISITION_SOURCES,
    DRINKWARE_TYPES,
    FLIP_OUTCOMES,
    OFFER_KINDS,
    OFFER_STATUSES,
)


# Enum integrity: raise at import time (hard fail, survives `python -O`).
if set(DRINKWARE_TYPES) != {
    "mug",
    "glass",
    "wine_glass",
    "pint_glass",
    "water_bottle",
    "shot_glass",
    "travel_mug",
    "tumbler",
    "novelty",
}:
    raise RuntimeError("DRINKWARE_TYPES drift detected")
if set(ACQUISITION_SOURCES) != {
    "gift",
    "trend",
    "conference",
    "souvenir",
    "inherited",
    "impulse_buy",
}:
    raise RuntimeError("ACQUISITION_SOURCES drift detected")
if set(OFFER_KINDS) != {"claim", "offer", "flip"}:
    raise RuntimeError("OFFER_KINDS drift detected")
if set(OFFER_STATUSES) != {
    "claimed",
    "awaiting_seller",
    "rejected",
    "withdrawn",
    "flipped_won",
    "flipped_lost",
}:
    raise RuntimeError("OFFER_STATUSES drift detected")
if set(FLIP_OUTCOMES) != {"win", "lose"}:
    raise RuntimeError("FLIP_OUTCOMES drift detected")


DrinkwareType = Literal[
    "mug",
    "glass",
    "wine_glass",
    "pint_glass",
    "water_bottle",
    "shot_glass",
    "travel_mug",
    "tumbler",
    "novelty",
]

AcquisitionSource = Literal[
    "gift",
    "trend",
    "conference",
    "souvenir",
    "inherited",
    "impulse_buy",
]


# Pydantic v2 serializes Decimal as string by default. We want JSON numbers
# on the wire while keeping Decimal precision internally.
Money = Annotated[
    Decimal,
    PlainSerializer(lambda v: float(v), return_type=float, when_used="json"),
]

# Handle regex — lowercase alnum + underscore, 2..64 chars. Enforced on both
# sellers and buyers.
Handle = Annotated[
    str,
    Field(min_length=2, max_length=64, pattern=r"^[A-Za-z0-9_]+$"),
]


class UserOut(BaseModel):
    """Public-safe projection of a user account.

    Intentionally omits ``email`` and ``password_hash`` so this schema can
    be embedded in any response (listings, offers, seller pages) without
    leaking private info.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "dad_of_four",
                "display_name": "Dad of Four (ranked 14th)",
                "verified": True,
                "avatar_url": None,
            }
        },
    )

    id: int
    username: str
    display_name: str
    verified: bool
    avatar_url: Optional[str] = None


class MeOut(UserOut):
    """Projection used by ``/auth/*`` endpoints for the authed caller.

    Adds ``email`` back — safe to return only to the owner of the account.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "dad_of_four",
                "display_name": "Dad of Four (ranked 14th)",
                "verified": True,
                "avatar_url": None,
                "email": "dad_of_four@gulp.market",
                "created_at": "2026-01-01T12:00:00Z",
            }
        },
    )

    email: EmailStr
    created_at: datetime


class MeUpdate(BaseModel):
    """Partial-update payload for ``PATCH /users/me``.

    Every field is optional; send only what changed. ``email`` is normalized
    to lowercase on the server. ``avatar_url`` may be set to ``null`` to clear.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "display_name": "Shelf Saver",
                "email": "you@example.com",
                "avatar_url": "http://localhost:8000/uploads/abc.webp",
            }
        }
    )

    display_name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class ChangePasswordIn(BaseModel):
    """Payload for ``POST /auth/change-password``."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_password": "gulp1234",
                "new_password": "a-brand-new-secret",
            }
        }
    )

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class DeleteMeIn(BaseModel):
    """Payload for ``DELETE /users/me`` — must repeat handle to confirm."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"confirm_username": "shelf_saver"}}
    )

    confirm_username: Handle


class RegisterIn(BaseModel):
    """Payload for ``POST /auth/register``.

    ``password`` is enforced at >=8 chars; everything else mirrors the
    public-handle rules already applied to sellers.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "shelf_saver@example.com",
                "username": "shelf_saver",
                "display_name": "Shelf Saver",
                "password": "correct horse battery staple",
            }
        }
    )

    email: EmailStr
    username: Handle
    display_name: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    """Payload for ``POST /auth/login``."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "dad_of_four@gulp.market",
                "password": "gulp1234",
            }
        }
    )

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ItemBase(BaseModel):
    """Shared fields between item creation and item responses."""

    title: str = Field(min_length=1, max_length=200)
    brand: str = Field(min_length=1, max_length=80)
    drinkware_type: DrinkwareType
    acquisition_source: AcquisitionSource
    size_oz: Money = Decimal("12")
    material: str = "ceramic"
    colorway: str = ""
    condition: str = "Used — lightly sipped"
    years_in_cupboard: int = Field(default=1, ge=0, le=60)
    image_emoji: str = "☕️"
    image_url: Optional[str] = Field(default=None, max_length=500)
    price: Money = Field(..., ge=Decimal("0"))
    original_price: Optional[Money] = None
    is_sold: bool = False

    @field_validator("original_price")
    @classmethod
    def _original_price_nonneg(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        """`original_price` is optional; when set, must be non-negative."""
        if v is not None and v < 0:
            raise ValueError("original_price must be >= 0")
        return v


class ItemCreate(ItemBase):
    """Payload for creating a listing.

    The seller is always the currently authenticated user; no handle field
    is accepted on the wire.
    """


class ItemUpdate(BaseModel):
    """Partial-update payload for ``PATCH /items/{id}``.

    Every field is optional so the client can send only what changed.
    Business rules (enum membership, non-negative prices, etc.) piggy-back
    on ``ItemBase`` via shared validators.
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=80)
    drinkware_type: Optional[DrinkwareType] = None
    acquisition_source: Optional[AcquisitionSource] = None
    size_oz: Optional[Money] = None
    material: Optional[str] = Field(default=None, max_length=40)
    colorway: Optional[str] = Field(default=None, max_length=80)
    condition: Optional[str] = Field(default=None, max_length=80)
    years_in_cupboard: Optional[int] = Field(default=None, ge=0, le=60)
    image_emoji: Optional[str] = Field(default=None, max_length=16)
    image_url: Optional[str] = Field(default=None, max_length=500)
    price: Optional[Money] = Field(default=None, ge=Decimal("0"))
    original_price: Optional[Money] = None
    is_sold: Optional[bool] = None

    @field_validator("original_price")
    @classmethod
    def _original_price_nonneg(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        """Allow clearing via ``None``; reject negative values when present."""
        if v is not None and v < 0:
            raise ValueError("original_price must be >= 0")
        return v


class ItemOut(ItemBase):
    """Item enriched with identifiers, timestamps, and seller info."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    seller: UserOut


class ItemPage(BaseModel):
    """Paged projection of `/items`."""

    items: list[ItemOut]
    total: int
    limit: int
    offset: int


FlipOutcome = Literal["win", "lose"]


class OfferCreate(BaseModel):
    """Buyer intent: claim at asking, lower offer, or coin flip.

    The buyer is always the currently authenticated user; no handle field
    is accepted on the wire. An optional ``message`` lets the buyer plead
    their case — the seller needs all the help they can get letting go.

    Variants (exactly one):

    - **Claim** — omit ``price``, ``low_price``, and ``high_price``.
    - **Lower offer** — send ``price`` strictly below asking.
    - **Coin flip** — send both ``low_price`` and ``high_price`` (omit
      ``price``). The server enforces ``low_price < asking < high_price``
      so the game has a real downside and a real upside.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "summary": "Claim at asking price",
                    "value": {"item_id": 5, "message": "Can pick up Tuesday."},
                },
                {
                    "summary": "Lowball offer",
                    "value": {
                        "item_id": 5,
                        "price": 8,
                        "message": "Love it, here's what I can do.",
                    },
                },
                {
                    "summary": "Propose a coin flip (asking $100)",
                    "value": {
                        "item_id": 5,
                        "low_price": 50,
                        "high_price": 150,
                        "message": "Feeling lucky. You?",
                    },
                },
            ]
        }
    )

    item_id: int
    price: Optional[Money] = Field(default=None, ge=Decimal("0"))
    low_price: Optional[Money] = Field(default=None, ge=Decimal("0"))
    high_price: Optional[Money] = Field(default=None, ge=Decimal("0"))
    message: Optional[str] = Field(default="", max_length=1000)

    @field_validator("high_price")
    @classmethod
    def _flip_prices_ordered(
        cls, v: Optional[Decimal], info
    ) -> Optional[Decimal]:
        """If both flip prices are present, enforce ``low < high``.

        Full ``low < asking < high`` enforcement happens in the route handler
        where the asking price is available; this validator catches the
        obvious shape bugs before the DB sees them.
        """
        low = info.data.get("low_price")
        if v is not None and low is not None and Decimal(v) <= Decimal(low):
            raise ValueError("high_price must be strictly greater than low_price")
        return v


class OfferOut(BaseModel):
    """Public-safe offer projection with the buyer embedded.

    For ``kind='flip'`` rows the two candidate prices and ``flip_outcome`` are
    set on creation (the server resolves the coin immediately). ``viewed_by_buyer_at``
    is set when the buyer acknowledges the reveal animation via
    ``POST /offers/{id}/view``.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    buyer: UserOut
    price: Money
    kind: str
    status: str
    message: str
    low_price: Optional[Money] = None
    high_price: Optional[Money] = None
    flip_outcome: Optional[FlipOutcome] = None
    viewed_by_buyer_at: Optional[datetime] = None
    created_at: datetime


class OfferWithItem(OfferOut):
    """Offer projection that also carries the item it was placed on.

    Powers the buyer dashboard so the client doesn't have to N+1 against
    ``/items/{id}`` for every row.
    """

    item: "ItemOut"


class Stats(BaseModel):
    """Summary metrics powering the homepage hero."""

    total_items: int
    cupboard_years_liberated: int
    total_offers: int
    value_liberated_usd: float


class UploadOut(BaseModel):
    """Absolute URL pointing at the persisted upload.

    Callers copy ``url`` into the listing's ``image_url`` when creating the
    item.
    """

    url: str
