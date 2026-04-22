"""add items.image_url

Revision ID: f14bf02ba198
Revises: b0a4a774d909
Create Date: 2026-04-21 15:57:48.014165

Adds an optional `image_url` pointing at a web-served illustration for the
listing (e.g. `/products/item_01_worlds_best_dad_mug.png`). Nullable so
existing rows fall back to the emoji placeholder.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f14bf02ba198"
down_revision: Union[str, Sequence[str], None] = "b0a4a774d909"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "items",
        sa.Column("image_url", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("items", "image_url")
