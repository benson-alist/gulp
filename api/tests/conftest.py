"""Shared pytest fixtures for the Gulp API test suite.

The suite runs against an in-memory sqlite database so it's hermetic and
fast. SQLAlchemy Numeric, CHECK constraints, and SELECT ... FOR UPDATE all
behave differently on sqlite vs. Postgres — the intent here is to cover the
app-level logic (handler branching, validation, ordering). Production-only
concerns (the partial unique index, real row locking) are exercised by the
Postgres-backed migration + integration tests, not by this suite.
"""
from __future__ import annotations

from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """FastAPI TestClient wired to a fresh in-memory sqlite DB per test.

    We override the `get_db` dependency so every request uses our
    test-scoped session. CHECK constraints from `__table_args__` are honored
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
    """Minimal valid ItemCreate payload; tests override what they care about."""
    base = {
        "title": "Mystery Mug",
        "brand": "Unbranded",
        "drinkware_type": "mug",
        "acquisition_source": "gift",
        "size_oz": 12,
        "material": "ceramic",
        "colorway": "",
        "condition": "Used — lightly sipped",
        "confession": "",
        "shame_index": 5,
        "years_in_cupboard": 2,
        "image_emoji": "☕️",
        "price": 10,
        "original_price": None,
        "seller_username": "seed_seller",
    }
    base.update(overrides)
    return base


@pytest.fixture()
def make_item(client: TestClient):
    """Factory that POSTs an item and returns its JSON body."""

    def _make(**overrides) -> dict:
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
