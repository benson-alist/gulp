"""Pydantic v2 request/response schemas for Gulp.

Currency fields are modelled as `Decimal` to avoid float drift but are
serialized as JSON numbers (not strings) via `PlainSerializer` so the
public wire format stays ergonomic for JavaScript clients.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator

from .models import (
    ACQUISITION_SOURCES,
    DRINKWARE_TYPES,
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
if set(OFFER_KINDS) != {"claim", "offer"}:
    raise RuntimeError("OFFER_KINDS drift detected")
if set(OFFER_STATUSES) != {"claimed", "awaiting_seller", "rejected", "withdrawn"}:
    raise RuntimeError("OFFER_STATUSES drift detected")


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
    """Public-safe projection of a user account."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    verified: bool


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
    confession: str = ""
    shame_index: int = Field(default=5, ge=1, le=10)
    years_in_cupboard: int = Field(default=1, ge=0, le=60)
    image_emoji: str = "☕️"
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
    """Payload for creating a listing. Seller is resolved by handle."""

    seller_username: Handle


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


class OfferCreate(BaseModel):
    """Claim at asking (price omitted) or make a lower offer (price provided).

    An optional `message` lets the buyer plead their case — the seller needs
    all the help they can get letting go of the cupboard.
    """

    item_id: int
    buyer_username: Handle
    price: Optional[Money] = Field(default=None, ge=Decimal("0"))
    message: Optional[str] = Field(default="", max_length=1000)


class OfferOut(BaseModel):
    """Public-safe offer projection."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    buyer_username: str
    price: Money
    kind: str
    status: str
    message: str
    created_at: datetime


class Stats(BaseModel):
    """Summary metrics powering the homepage hero."""

    total_items: int
    cupboard_years_liberated: int
    average_shame: float
    confessions_on_file: int
    total_offers: int
    value_liberated_usd: float
