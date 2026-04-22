"""ORM models for Gulp — users, drinkware items, and offers.

Gulp v2 intentionally avoids sneaker-marketplace mechanics (lowest ask /
highest bid / last sale, authentication queues). Listings have a single
asking `price` plus an optional `original_price` anchor for self-roasting
copy (e.g. "paid $52, asking $12").

Currency columns are `Numeric(10, 2)` mapped to `Decimal` — never `float` —
so cents survive round-trips through Python.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


DRINKWARE_TYPES: tuple[str, ...] = (
    "mug",
    "glass",
    "wine_glass",
    "pint_glass",
    "water_bottle",
    "shot_glass",
    "travel_mug",
    "tumbler",
    "novelty",
)
"""All drinkware categories Gulp accepts. Mirrored in a DB CHECK constraint."""


ACQUISITION_SOURCES: tuple[str, ...] = (
    "gift",
    "trend",
    "conference",
    "souvenir",
    "inherited",
    "impulse_buy",
)
"""How a piece of drinkware entered the seller's cupboard — fuel for the roast."""


OFFER_KINDS: tuple[str, ...] = ("claim", "offer")
OFFER_STATUSES: tuple[str, ...] = ("claimed", "awaiting_seller", "rejected", "withdrawn")


def _in_list(column: str, values: tuple[str, ...]) -> str:
    """Render a portable SQL `column IN (...)` CHECK expression."""
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"


class User(Base):
    """A seller or buyer handle.

    Auth is out of scope for v1, so `username` is the primary identity.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128))
    verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    items: Mapped[list["Item"]] = relationship(back_populates="seller")


class Item(Base):
    """A drinkware listing on Gulp.

    Humor columns (`shame_index`, `years_in_cupboard`, `acquisition_source`)
    exist so the UI can roast the seller lovingly.
    """

    __tablename__ = "items"
    __table_args__ = (
        CheckConstraint(
            _in_list("drinkware_type", DRINKWARE_TYPES),
            name="ck_items_drinkware_type",
        ),
        CheckConstraint(
            _in_list("acquisition_source", ACQUISITION_SOURCES),
            name="ck_items_acquisition_source",
        ),
        CheckConstraint("price >= 0", name="ck_items_price_nonneg"),
        CheckConstraint(
            "original_price IS NULL OR original_price >= 0",
            name="ck_items_original_price_nonneg",
        ),
        CheckConstraint(
            "shame_index BETWEEN 1 AND 10", name="ck_items_shame_index_range"
        ),
        CheckConstraint(
            "years_in_cupboard BETWEEN 0 AND 60",
            name="ck_items_years_range",
        ),
        Index("ix_items_is_sold", "is_sold"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    brand: Mapped[str] = mapped_column(String(80), index=True)
    drinkware_type: Mapped[str] = mapped_column(String(32), index=True)
    acquisition_source: Mapped[str] = mapped_column(String(32), index=True)
    size_oz: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("12"))
    material: Mapped[str] = mapped_column(String(40), default="ceramic")
    colorway: Mapped[str] = mapped_column(String(80), default="")
    condition: Mapped[str] = mapped_column(String(80), default="Used — lightly sipped")
    shame_index: Mapped[int] = mapped_column(Integer, default=5)
    years_in_cupboard: Mapped[int] = mapped_column(Integer, default=1)
    image_emoji: Mapped[str] = mapped_column(String(16), default="☕️")
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    original_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    is_sold: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    seller: Mapped["User"] = relationship(back_populates="items")
    offers: Mapped[list["Offer"]] = relationship(back_populates="item")


class Offer(Base):
    """A claim (buy-now at asking price) or a negotiated offer on an `Item`.

    - `kind="claim"` means the buyer is taking it home at the asking price.
    - `kind="offer"` means the buyer submitted a lower number for the seller
      to consider.

    The `ck_offers_one_claim_per_item` partial unique index (Postgres) is
    enforced via migration, not ORM, so tests on sqlite stay happy.
    """

    __tablename__ = "offers"
    __table_args__ = (
        CheckConstraint(
            _in_list("kind", OFFER_KINDS), name="ck_offers_kind"
        ),
        CheckConstraint(
            _in_list("status", OFFER_STATUSES), name="ck_offers_status"
        ),
        CheckConstraint("price >= 0", name="ck_offers_price_nonneg"),
        Index("ix_offers_item_id", "item_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    buyer_username: Mapped[str] = mapped_column(String(64))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    kind: Mapped[str] = mapped_column(String(16), default="claim")
    status: Mapped[str] = mapped_column(String(32), default="claimed")
    message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    item: Mapped["Item"] = relationship(back_populates="offers")
