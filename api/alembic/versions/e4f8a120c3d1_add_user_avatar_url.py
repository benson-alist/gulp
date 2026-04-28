"""add nullable avatar_url on users

Revision ID: e4f8a120c3d1
Revises: c7d3f9a21e08
Create Date: 2026-04-28 12:00:00.000000

Adds an optional profile image URL for account settings and public display.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f8a120c3d1"
down_revision: Union[str, Sequence[str], None] = "c7d3f9a21e08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add ``users.avatar_url`` for optional profile photos."""
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    """Drop ``users.avatar_url``."""
    op.drop_column("users", "avatar_url")
