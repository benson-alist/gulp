"""Add items.cover_is_generated for baked auto-cover uploads.

Revision ID: a1b2c3d4e5f6
Revises: c4d9118b92a7
Create Date: 2026-05-08

When true, the listing photo was produced by the client-side illustration
pipeline (background + silhouette + motif flock) and rasterized to the
same upload pipeline as real photos. The browse UI skips the live MotifFlock
overlay so decals are not doubled.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "c4d9118b92a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "items",
        sa.Column(
            "cover_is_generated",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("items", "cover_is_generated")
