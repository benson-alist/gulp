"""Shared pytest fixtures for the Gulp API test suite.

The suite runs against an in-memory sqlite database so it's hermetic and
fast. SQLAlchemy Numeric, CHECK constraints, and SELECT ... FOR UPDATE all
behave differently on sqlite vs. Postgres — the intent here is to cover the
app-level logic (handler branching, validation, ordering). Production-only
concerns (the partial unique index, real row locking) are exercised by the
Postgres-backed migration + integration tests, not by this suite.

v3 routes (``POST /items``, ``POST /offers``, ``POST /uploads/image``) require
cookie auth. Fixtures seed known users and :func:`login_as` sets the
``TestClient`` session cookie via ``POST /auth/login``.
"""
from __future__ import annotations

import os
from typing import Iterator

# ``app.main`` lifespan must not run ``SessionLocal()`` flip-view resets during
# tests: the suite overrides ``get_db`` with sqlite, but ``SessionLocal`` still
# points at the developer ``DATABASE_URL`` (Postgres).
os.environ["GULP_RUNNING_TESTS"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import auth, models
from app.db import Base, get_db
from app.main import app

TEST_PASSWORD = "testpass1234"
TEST_EMAIL_DOMAIN = "test.gulp.market"


def _email(username: str) -> str:
    """Return the canonical test login email for a public handle."""
    return f"{username}@{TEST_EMAIL_DOMAIN}"


def _seed_test_users(db: Session) -> None:
    """Insert deterministic accounts used across item/offer/upload tests.

    Every row shares :data:`TEST_PASSWORD` (bcrypt-hashed) so tests can call
    :func:`login_as` without ad-hoc provisioning per case.
    """
    hashed = auth.hash_password(TEST_PASSWORD)
    handles = (
        "seed_seller",
        "shelf_saver",
        "late_latte",
        "bargain_ben",
        "mirror_mike",
        "over_tom",
    )
    for username in handles:
        db.add(
            models.User(
                email=_email(username),
                username=username,
                display_name=username.replace("_", " ").title(),
                password_hash=hashed,
                verified=True,
            )
        )
    db.commit()


def login_as(client: TestClient, username: str) -> None:
    """Authenticate ``client`` as ``username`` (sets ``gulp_auth`` cookie).

    Raises AssertionError if login fails — tests should treat that as a
    fixture/setup bug, not a product regression.
    """
    res = client.post(
        "/auth/login",
        json={"email": _email(username), "password": TEST_PASSWORD},
    )
    assert res.status_code == 200, res.text


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """FastAPI TestClient wired to a fresh in-memory sqlite DB per test.

    We override the ``get_db`` dependency so every request uses our
    test-scoped session. CHECK constraints from ``__table_args__`` are honored
    by sqlite too, so enum/range validation is still exercised.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # share one in-memory DB across sessions
    )

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_connection, _):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, future=True
    )

    bootstrap = TestingSession()
    try:
        _seed_test_users(bootstrap)
    finally:
        bootstrap.close()

    def _override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def _item_payload(**overrides) -> dict:
    """Minimal valid ItemCreate payload; tests override what they care about.

    The seller is always the currently authenticated user — there is no
    ``seller_username`` field on the wire in v3.
    """
    base = {
        "title": "Mystery Mug",
        "brand": "Unbranded",
        "drinkware_type": "mug",
        "acquisition_source": "gift",
        "size_oz": 12,
        "material": "ceramic",
        "colorway": "",
        "condition": "Used — lightly sipped",
        "years_in_cupboard": 2,
        "image_emoji": "☕️",
        "price": 10,
        "original_price": None,
    }
    base.update(overrides)
    return base


@pytest.fixture()
def make_item(client: TestClient):
    """Factory that logs in as ``seed_seller``, POSTs an item, returns JSON."""

    def _make(**overrides) -> dict:
        login_as(client, "seed_seller")
        res = client.post("/items", json=_item_payload(**overrides))
        assert res.status_code == 201, res.text
        return res.json()

    return _make


# Re-export for tests that want to build bespoke payloads.
item_payload = _item_payload


@pytest.fixture()
def models_module():
    """Expose the ORM module so tests can introspect without re-importing."""
    return models
