"""add viewed_by_buyer_at on offers

Revision ID: b8e3f91a2c04
Revises: f7c1b20d8a93
Create Date: 2026-04-29 00:10:00.000000

Tracks when the buyer has opened the post-flip reveal UI. ``NULL`` means the
resolved flip is still "unseen" for dashboard highlighting and the one-time
coin animation.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8e3f91a2c04"
down_revision: Union[str, Sequence[str], None] = "f7c1b20d8a93"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add nullable ``offers.viewed_by_buyer_at``."""
    op.add_column(
        "offers",
        sa.Column(
            "viewed_by_buyer_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Drop ``offers.viewed_by_buyer_at``."""
    op.drop_column("offers", "viewed_by_buyer_at")
