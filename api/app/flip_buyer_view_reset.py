"""Utilities to clear buyer flip-reveal stamps (local dev / QA).

Resolved coin-flip offers store ``viewed_by_buyer_at`` when the buyer opens the
reveal modal. Clearing that column makes every settled flip look \"unseen\"
again in **My bids** without mutating outcomes or prices.
"""
from __future__ import annotations

from sqlalchemy import update
from sqlalchemy.orm import Session

from app import models


def clear_resolved_flip_buyer_views(session: Session) -> int:
    """Set ``viewed_by_buyer_at`` to ``NULL`` for all terminal flip offers.

    Only rows with ``kind == 'flip'`` and status ``flipped_won`` or
    ``flipped_lost`` are updated. Pending flips are untouched.

    Args:
        session: Open SQLAlchemy session; caller commits or rolls back.

    Returns:
        The number of rows matched by the ``UPDATE`` (``0`` if none).
    """
    stmt = (
        update(models.Offer)
        .where(models.Offer.kind == "flip")
        .where(models.Offer.status.in_(("flipped_won", "flipped_lost")))
        .values(viewed_by_buyer_at=None)
    )
    result = session.execute(stmt)
    n = result.rowcount
    return int(n) if n is not None else 0
