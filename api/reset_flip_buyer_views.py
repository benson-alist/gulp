"""Clear ``viewed_by_buyer_at`` on all resolved coin flips (local dev helper).

After you have opened the buyer reveal modal, the API stamps the offer so the
highlight disappears. Run this script to reset that stamp and test the
\"unseen\" buyer UX again without creating new listings.

Usage (from ``api/`` with the venv activated)::

    python reset_flip_buyer_views.py

Safe for development databases only — do not run against production data you
care about unless you intentionally want buyers to see the reveal prompt again.
"""
from __future__ import annotations

from app.db import SessionLocal
from app.flip_buyer_view_reset import clear_resolved_flip_buyer_views


def run() -> int:
    """Set ``viewed_by_buyer_at`` to NULL for every terminal flip row.

    Returns the number of rows matched by the UPDATE (may be 0).
    """
    db = SessionLocal()
    try:
        n = clear_resolved_flip_buyer_views(db)
        db.commit()
        print(f"Cleared buyer view stamp on {n} resolved flip offer(s).")
        return n
    finally:
        db.close()


if __name__ == "__main__":
    run()
