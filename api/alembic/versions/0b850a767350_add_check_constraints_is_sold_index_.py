"""add check constraints, is_sold index, single-claim guard

Revision ID: 0b850a767350
Revises: 25bbf1980286
Create Date: 2026-04-20 18:10:48.531042

This migration hardens the v2 schema:

- Adds CHECK constraints for the drinkware/acquisition/offer enums so the
  database (not just Pydantic) guards the canonical vocabulary.
- Adds non-negativity and range checks for price, original_price,
  shame_index and years_in_cupboard.
- Adds `ix_items_is_sold` so `/stats` and future "in-stock" queries don't
  scan the full table.
- Adds `ix_offers_item_id` for lookup by item.
- Adds a partial unique index `uq_offers_one_claim_per_item` so two racing
  claims on the same cup cannot both succeed.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "0b850a767350"
down_revision: Union[str, Sequence[str], None] = "25bbf1980286"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DRINKWARE_TYPES = (
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
ACQUISITION_SOURCES = (
    "gift",
    "trend",
    "conference",
    "souvenir",
    "inherited",
    "impulse_buy",
)
OFFER_KINDS = ("claim", "offer")
OFFER_STATUSES = ("claimed", "awaiting_seller", "rejected", "withdrawn")


def _in_list(col: str, values: tuple[str, ...]) -> str:
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{col} IN ({quoted})"


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index("ix_items_is_sold", "items", ["is_sold"], unique=False)
    op.create_index("ix_offers_item_id", "offers", ["item_id"], unique=False)

    op.create_check_constraint(
        "ck_items_drinkware_type",
        "items",
        _in_list("drinkware_type", DRINKWARE_TYPES),
    )
    op.create_check_constraint(
        "ck_items_acquisition_source",
        "items",
        _in_list("acquisition_source", ACQUISITION_SOURCES),
    )
    op.create_check_constraint(
        "ck_items_price_nonneg", "items", "price >= 0"
    )
    op.create_check_constraint(
        "ck_items_original_price_nonneg",
        "items",
        "original_price IS NULL OR original_price >= 0",
    )
    op.create_check_constraint(
        "ck_items_shame_index_range",
        "items",
        "shame_index BETWEEN 1 AND 10",
    )
    op.create_check_constraint(
        "ck_items_years_range",
        "items",
        "years_in_cupboard BETWEEN 0 AND 60",
    )

    op.create_check_constraint(
        "ck_offers_kind", "offers", _in_list("kind", OFFER_KINDS)
    )
    op.create_check_constraint(
        "ck_offers_status", "offers", _in_list("status", OFFER_STATUSES)
    )
    op.create_check_constraint(
        "ck_offers_price_nonneg", "offers", "price >= 0"
    )

    # Partial unique index: at most one `claim` per item.
    op.execute(
        "CREATE UNIQUE INDEX uq_offers_one_claim_per_item "
        "ON offers (item_id) WHERE kind = 'claim'"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS uq_offers_one_claim_per_item")

    op.drop_constraint("ck_offers_price_nonneg", "offers", type_="check")
    op.drop_constraint("ck_offers_status", "offers", type_="check")
    op.drop_constraint("ck_offers_kind", "offers", type_="check")

    op.drop_constraint("ck_items_years_range", "items", type_="check")
    op.drop_constraint("ck_items_shame_index_range", "items", type_="check")
    op.drop_constraint("ck_items_original_price_nonneg", "items", type_="check")
    op.drop_constraint("ck_items_price_nonneg", "items", type_="check")
    op.drop_constraint("ck_items_acquisition_source", "items", type_="check")
    op.drop_constraint("ck_items_drinkware_type", "items", type_="check")

    op.drop_index("ix_offers_item_id", table_name="offers")
    op.drop_index("ix_items_is_sold", table_name="items")
