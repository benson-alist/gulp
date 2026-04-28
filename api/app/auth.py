"""Auth primitives for Gulp — password hashing, JWT mint/verify, cookie I/O.

Design goals:
    * Keep the full auth surface in one module so the rest of the app can
      depend on it through simple FastAPI dependencies.
    * Never leak whether a lookup failed on email vs password — unauthenticated
      callers always get a single, neutral "invalid credentials" error.
    * The token lives in an ``HttpOnly; SameSite=Lax`` cookie set by the API
      and sent automatically by the browser. No token ever touches JS or
      ``localStorage``.

See :mod:`app.config` for the tunables (`jwt_secret`, `cookie_*`).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .config import settings
from .db import get_db


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    """Return a bcrypt hash (cost=12) of ``plain`` as a UTF-8 string.

    The returned value embeds its own salt + cost factor; store it directly.
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time compare ``plain`` against a previously hashed value.

    Any exception from bcrypt (e.g. malformed stored hash) is swallowed and
    treated as a mismatch — callers should never branch on error shape.
    """
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT mint / verify
# ---------------------------------------------------------------------------

def create_access_token(user_id: int) -> str:
    """Mint a short JWT with ``sub=user_id`` and standard iat/exp claims.

    TTL is ``settings.jwt_ttl_seconds``. The algorithm is configured via
    ``settings.jwt_algorithm``; the default HS256 matches the symmetric
    ``jwt_secret``.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_ttl_seconds)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[int]:
    """Return the embedded ``user_id`` or ``None`` if the token is invalid.

    Invalid covers: bad signature, expired, missing/malformed ``sub``.
    """
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.isdigit():
        return None
    return int(sub)


# ---------------------------------------------------------------------------
# Cookie helpers
# ---------------------------------------------------------------------------

def set_auth_cookie(response: Response, token: str) -> None:
    """Attach the auth JWT to ``response`` with consistent cookie flags.

    Cookie attributes are sourced from settings so dev (no HTTPS) and prod
    (HTTPS + cross-subdomain) behave consistently.
    """
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=settings.jwt_ttl_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie using matching attributes so browsers evict it."""
    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated.",
)


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> models.User:
    """Resolve the caller to a `User` via the auth cookie or raise 401.

    Intended for routes that *require* authentication (creating items,
    submitting offers, editing your own listings). Pair with
    :func:`get_current_user_optional` for routes that merely adapt to the
    caller's identity.
    """
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise _CREDENTIALS_ERROR
    user_id = decode_token(token)
    if user_id is None:
        raise _CREDENTIALS_ERROR
    user = db.get(models.User, user_id)
    if user is None:
        raise _CREDENTIALS_ERROR
    return user


def get_current_user_optional(
    request: Request, db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Like :func:`get_current_user` but returns ``None`` instead of raising.

    Useful for endpoints that should still respond to anonymous callers but
    want to enrich output for logged-in users (e.g. "is this listing mine?").
    """
    token = request.cookies.get(settings.cookie_name)
    if not token:
        return None
    user_id = decode_token(token)
    if user_id is None:
        return None
    return db.get(models.User, user_id)
