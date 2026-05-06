"""drop items.confession column

Revision ID: b0a4a774d909
Revises: 0b850a767350
Create Date: 2026-04-21 14:54:27.447581

The confession column served a parody "confessions wall" that has since
been retired — Gulp is just a marketplace now. Drop the column cleanly;
the partial unique index `uq_offers_one_claim_per_item` created in raw
SQL in 0b850a767350 is intentionally preserved (autogenerate flags it
because it lives outside ORM metadata).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b0a4a774d909"
down_revision: Union[str, Sequence[str], None] = "0b850a767350"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("items", "confession")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "items",
        sa.Column(
            "confession",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
    )
    op.alter_column("items", "confession", server_default=None)
