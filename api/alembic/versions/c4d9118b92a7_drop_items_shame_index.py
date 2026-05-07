"""drop items.shame_index and its range check

Revision ID: c4d9118b92a7
Revises: b8e3f91a2c04
Create Date: 2026-05-07 12:00:00.000000

The honesty / shame meter has been removed from the product; listings no
longer carry a shame_index field.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d9118b92a7"
down_revision: Union[str, Sequence[str], None] = "b8e3f91a2c04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("ck_items_shame_index_range", "items", type_="check")
    op.drop_column("items", "shame_index")


def downgrade() -> None:
    op.add_column(
        "items",
        sa.Column(
            "shame_index",
            sa.Integer(),
            nullable=False,
            server_default="5",
        ),
    )
    op.create_check_constraint(
        "ck_items_shame_index_range",
        "items",
        "shame_index BETWEEN 1 AND 10",
    )
    op.alter_column("items", "shame_index", server_default=None)
