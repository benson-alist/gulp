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


OFFER_KINDS: tuple[str, ...] = ("claim", "offer", "flip")
OFFER_STATUSES: tuple[str, ...] = (
    "claimed",
    "awaiting_seller",
    "rejected",
    "withdrawn",
    "flipped_won",
    "flipped_lost",
)
"""Offer lifecycle states.

- ``claimed``: buyer took the item at asking price (terminal).
- ``awaiting_seller``: offer or flip pending seller response.
- ``rejected``: seller declined the pending offer/flip (terminal).
- ``withdrawn``: buyer walked back their offer (reserved for future use).
- ``flipped_won`` / ``flipped_lost``: flip resolved from the *buyer's*
  perspective — ``flipped_won`` means the buyer pays ``low_price``,
  ``flipped_lost`` means the buyer pays ``high_price`` (both terminal).
"""


FLIP_OUTCOMES: tuple[str, ...] = ("win", "lose")
"""Possible outcomes of a coin flip, from the *buyer's* perspective."""


def _in_list(column: str, values: tuple[str, ...]) -> str:
    """Render a portable SQL `column IN (...)` CHECK expression."""
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"


class User(Base):
    """A Gulp account — one user, dual role (can both sell and bid).

    ``email`` is used for login; ``username`` is the public handle rendered
    on listings and offers. ``password_hash`` stores a bcrypt digest and is
    never serialized (see ``schemas.UserOut`` / ``schemas.MeOut``).
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128))
    password_hash: Mapped[str] = mapped_column(String(255))
    verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    items: Mapped[list["Item"]] = relationship(back_populates="seller")
    offers: Mapped[list["Offer"]] = relationship(back_populates="buyer")


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
    """A claim, negotiated offer, or coin-flip proposal on an `Item`.

    Three flavours of buyer intent share this row:

    - ``kind="claim"`` — the buyer is taking it home at the asking price.
      ``status`` is set to ``claimed`` and the item is marked sold.
    - ``kind="offer"`` — the buyer submitted a lower number for the seller
      to consider. ``status`` starts at ``awaiting_seller``.
    - ``kind="flip"`` — the buyer proposed flipping a coin between two
      candidate prices. ``low_price`` is paid if the buyer wins, ``high_price``
      if they lose. The server resolves the flip atomically on seller accept.
      After resolution, ``viewed_by_buyer_at`` records when the buyer opened
      the one-time reveal UI (``NULL`` until ``POST /offers/{id}/view``).

    Flip-specific invariants (enforced by CHECK constraint):

    - ``kind="flip"`` rows must have both ``low_price`` and ``high_price`` set
      and ``0 <= low_price < high_price``.
    - Non-flip rows must have ``low_price``, ``high_price``, and
      ``flip_outcome`` all NULL — prevents accidental mixing in the UI.

    The ``ck_offers_one_claim_per_item`` partial unique index (Postgres) is
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
        CheckConstraint(
            "(flip_outcome IS NULL) OR (flip_outcome IN ('win', 'lose'))",
            name="ck_offers_flip_outcome",
        ),
        CheckConstraint(
            # Flip rows must carry both candidate prices, strictly ordered.
            # Non-flip rows must have all three flip columns NULL so the
            # table never accumulates half-populated flip leftovers.
            "("
            "kind = 'flip' "
            "AND low_price IS NOT NULL "
            "AND high_price IS NOT NULL "
            "AND low_price >= 0 "
            "AND low_price < high_price"
            ") OR ("
            "kind <> 'flip' "
            "AND low_price IS NULL "
            "AND high_price IS NULL "
            "AND flip_outcome IS NULL"
            ")",
            name="ck_offers_flip_shape",
        ),
        Index("ix_offers_item_id", "item_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    kind: Mapped[str] = mapped_column(String(16), default="claim")
    status: Mapped[str] = mapped_column(String(32), default="claimed")
    message: Mapped[str] = mapped_column(Text, default="")
    low_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    high_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    flip_outcome: Mapped[Optional[str]] = mapped_column(
        String(8), nullable=True
    )
    # First ``POST /offers/{id}/view`` from the buyer; NULL = reveal not seen.
    viewed_by_buyer_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    item: Mapped["Item"] = relationship(back_populates="offers")
    buyer: Mapped["User"] = relationship(back_populates="offers")
