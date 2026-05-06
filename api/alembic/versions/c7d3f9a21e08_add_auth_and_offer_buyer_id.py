"""add auth columns on users; replace offers.buyer_username with buyer_id

Revision ID: c7d3f9a21e08
Revises: f14bf02ba198
Create Date: 2026-04-27 22:10:00.000000

Introduces real authentication:

- ``users`` gains ``email`` (unique) and ``password_hash`` columns. Existing
  rows are backfilled with placeholder values rewritten immediately by the
  updated ``seed.py``.
- ``offers.buyer_username`` (a free string) is replaced by ``buyer_id``, a
  proper FK to ``users.id``. Existing offer rows are truncated because they
  cannot be retroactively attributed to a real account.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d3f9a21e08"
down_revision: Union[str, Sequence[str], None] = "f14bf02ba198"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. users: add email + password_hash (nullable for the backfill step)
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column(
        "users", sa.Column("password_hash", sa.String(length=255), nullable=True)
    )

    # Backfill: synthetic email per existing user + placeholder hash. The
    # updated seed.py will rewrite these with real bcrypt hashes; this is
    # only here so we can safely mark the columns NOT NULL below.
    op.execute(
        "UPDATE users SET "
        "email = username || '@gulp.local', "
        "password_hash = 'pending-reseed' "
        "WHERE email IS NULL OR password_hash IS NULL"
    )

    op.alter_column("users", "email", nullable=False)
    op.alter_column("users", "password_hash", nullable=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. offers: drop the free-string buyer handle; add a real FK.
    # Existing offers are wiped because their buyers were never real accounts
    # and can't be retro-authenticated. The partial unique index
    # `uq_offers_one_claim_per_item` survives — it's keyed on item_id only.
    op.execute("DELETE FROM offers")
    op.drop_column("offers", "buyer_username")
    op.add_column(
        "offers", sa.Column("buyer_id", sa.Integer(), nullable=False)
    )
    op.create_foreign_key(
        "fk_offers_buyer_id_users",
        "offers",
        "users",
        ["buyer_id"],
        ["id"],
    )
    op.create_index("ix_offers_buyer_id", "offers", ["buyer_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_offers_buyer_id", table_name="offers")
    op.drop_constraint("fk_offers_buyer_id_users", "offers", type_="foreignkey")
    op.drop_column("offers", "buyer_id")
    op.add_column(
        "offers",
        sa.Column("buyer_username", sa.String(length=64), nullable=False, server_default=""),
    )
    op.alter_column("offers", "buyer_username", server_default=None)

    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")
