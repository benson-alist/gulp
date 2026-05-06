"""add coin-flip columns, kinds, and statuses on offers

Revision ID: f7c1b20d8a93
Revises: e4f8a120c3d1
Create Date: 2026-04-28 23:30:00.000000

Adds the coin-flip offer flavour:

- Three new columns on ``offers``: ``low_price``, ``high_price``,
  ``flip_outcome`` — all nullable, only populated for ``kind='flip'`` rows.
- Broadens ``ck_offers_kind`` to allow ``'flip'`` and ``ck_offers_status`` to
  allow ``'flipped_won'`` / ``'flipped_lost'``.
- Adds ``ck_offers_flip_outcome`` and ``ck_offers_flip_shape`` so the DB
  refuses half-populated flip rows or flip fields on non-flip offers.

The existing ``uq_offers_one_claim_per_item`` partial unique index is
untouched — flips use their own ``kind='flip'`` marker and a resolved flip
does not need the claim guard (item-sold enforcement at the app layer is
protected by ``is_sold`` + ``SELECT ... FOR UPDATE``).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7c1b20d8a93"
down_revision: Union[str, Sequence[str], None] = "e4f8a120c3d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OFFER_KINDS_OLD = ("claim", "offer")
OFFER_KINDS_NEW = ("claim", "offer", "flip")
OFFER_STATUSES_OLD = ("claimed", "awaiting_seller", "rejected", "withdrawn")
OFFER_STATUSES_NEW = (
    "claimed",
    "awaiting_seller",
    "rejected",
    "withdrawn",
    "flipped_won",
    "flipped_lost",
)


def _in_list(col: str, values: tuple[str, ...]) -> str:
    """Render a portable SQL ``IN (...)`` CHECK expression."""
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{col} IN ({quoted})"


_FLIP_SHAPE_EXPR = (
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
    ")"
)


def upgrade() -> None:
    """Widen offer enums and add flip-specific columns + constraints."""
    with op.batch_alter_table("offers") as batch:
        batch.add_column(
            sa.Column("low_price", sa.Numeric(precision=10, scale=2), nullable=True)
        )
        batch.add_column(
            sa.Column("high_price", sa.Numeric(precision=10, scale=2), nullable=True)
        )
        batch.add_column(
            sa.Column("flip_outcome", sa.String(length=8), nullable=True)
        )

    op.drop_constraint("ck_offers_kind", "offers", type_="check")
    op.create_check_constraint(
        "ck_offers_kind", "offers", _in_list("kind", OFFER_KINDS_NEW)
    )

    op.drop_constraint("ck_offers_status", "offers", type_="check")
    op.create_check_constraint(
        "ck_offers_status", "offers", _in_list("status", OFFER_STATUSES_NEW)
    )

    op.create_check_constraint(
        "ck_offers_flip_outcome",
        "offers",
        "(flip_outcome IS NULL) OR (flip_outcome IN ('win', 'lose'))",
    )
    op.create_check_constraint(
        "ck_offers_flip_shape",
        "offers",
        _FLIP_SHAPE_EXPR,
    )


def downgrade() -> None:
    """Reverse: drop flip columns + tighten enums back to v3."""
    op.drop_constraint("ck_offers_flip_shape", "offers", type_="check")
    op.drop_constraint("ck_offers_flip_outcome", "offers", type_="check")

    op.drop_constraint("ck_offers_status", "offers", type_="check")
    op.create_check_constraint(
        "ck_offers_status", "offers", _in_list("status", OFFER_STATUSES_OLD)
    )

    op.drop_constraint("ck_offers_kind", "offers", type_="check")
    op.create_check_constraint(
        "ck_offers_kind", "offers", _in_list("kind", OFFER_KINDS_OLD)
    )

    with op.batch_alter_table("offers") as batch:
        batch.drop_column("flip_outcome")
        batch.drop_column("high_price")
        batch.drop_column("low_price")
