"""Tests for instant coin-flip offers.

Flips resolve on ``POST /offers`` when both ``low_price`` and ``high_price``
are sent. Randomness uses ``secrets.randbelow(2)`` in ``app.main``.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import login_as


def _propose_flip(
    client: TestClient,
    item_id: int,
    low: int,
    high: int,
    message: str = "",
) -> dict:
    """Helper: POST a flip offer and return the decoded response body."""
    res = client.post(
        "/offers",
        json={
            "item_id": item_id,
            "low_price": low,
            "high_price": high,
            "message": message,
        },
    )
    assert res.status_code == 201, res.text
    return res.json()


def test_flip_resolves_immediately_buyer_wins(
    client: TestClient, make_item, monkeypatch
) -> None:
    """``randbelow(2) == 0`` => buyer wins; price settles at ``low_price``."""
    from app import main as main_module

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 0, raising=True
    )

    item = make_item(price=100)
    login_as(client, "bargain_ben")
    body = _propose_flip(client, item["id"], low=40, high=160, message="Luck?")

    assert body["kind"] == "flip"
    assert body["status"] == "flipped_won"
    assert body["flip_outcome"] == "win"
    assert body["low_price"] == 40
    assert body["high_price"] == 160
    assert body["price"] == 40
    assert body["buyer"]["username"] == "bargain_ben"

    fetched = client.get(f"/items/{item['id']}").json()
    assert fetched["is_sold"] is True


def test_flip_resolves_immediately_buyer_loses(
    client: TestClient, make_item, monkeypatch
) -> None:
    """``randbelow(2) == 1`` => buyer loses; price settles at ``high_price``."""
    from app import main as main_module

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 1, raising=True
    )

    item = make_item(price=100)
    login_as(client, "bargain_ben")
    body = _propose_flip(client, item["id"], low=40, high=160)

    assert body["status"] == "flipped_lost"
    assert body["flip_outcome"] == "lose"
    assert body["price"] == 160

    fetched = client.get(f"/items/{item['id']}").json()
    assert fetched["is_sold"] is True


def test_flip_low_must_be_below_asking(client: TestClient, make_item) -> None:
    """``low_price`` >= asking is a degenerate gamble; 400."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "low_price": 100, "high_price": 150},
    )
    assert res.status_code == 400
    assert "straddle" in res.json()["detail"]


def test_flip_high_must_exceed_asking(client: TestClient, make_item) -> None:
    """``high_price`` <= asking would mean the seller always loses; 400."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "low_price": 50, "high_price": 100},
    )
    assert res.status_code == 400


def test_flip_requires_both_prices(client: TestClient, make_item) -> None:
    """Sending only one of low/high is a 400, not a silent offer fallback."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "low_price": 50},
    )
    assert res.status_code == 400


def test_flip_cannot_mix_with_price(client: TestClient, make_item) -> None:
    """Mixing ``price`` with flip fields is ambiguous; 400."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={
            "item_id": item["id"],
            "price": 80,
            "low_price": 50,
            "high_price": 150,
        },
    )
    assert res.status_code == 400


def test_flip_high_must_exceed_low_422(client: TestClient, make_item) -> None:
    """``high_price <= low_price`` trips the Pydantic validator (422)."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "low_price": 150, "high_price": 50},
    )
    assert res.status_code == 422


def test_flip_cannot_target_own_listing(client: TestClient, make_item) -> None:
    """Sellers proposing flips on their own listings get 403."""
    item = make_item(price=100)
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "low_price": 50, "high_price": 150},
    )
    assert res.status_code == 403


def test_seller_can_reject_pending_offer(
    client: TestClient, make_item
) -> None:
    """Reject takes an awaiting_seller lower offer to status=rejected."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "price": 80},
    )
    assert res.status_code == 201
    offer = res.json()

    login_as(client, "seed_seller")
    res = client.post(f"/offers/{offer['id']}/reject")
    assert res.status_code == 200
    assert res.json()["status"] == "rejected"

    fetched = client.get(f"/items/{item['id']}").json()
    assert fetched["is_sold"] is False


def test_reject_is_seller_only(client: TestClient, make_item) -> None:
    """Only the item's seller can reject offers (403)."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "price": 80},
    )
    assert res.status_code == 201
    offer = res.json()

    login_as(client, "late_latte")
    res = client.post(f"/offers/{offer['id']}/reject")
    assert res.status_code == 403


def test_reject_claim_is_409(client: TestClient, make_item) -> None:
    """Claims are terminal; rejecting one returns 409, not a state corruption."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post("/offers", json={"item_id": item["id"]})
    assert res.status_code == 201
    offer_id = res.json()["id"]

    login_as(client, "seed_seller")
    res = client.post(f"/offers/{offer_id}/reject")
    assert res.status_code == 409


def test_buyer_can_mark_flip_viewed(
    client: TestClient, make_item, monkeypatch
) -> None:
    """After an instant flip, the buyer can stamp ``viewed_by_buyer_at``."""
    from app import main as main_module

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 0, raising=True
    )

    item = make_item(price=100)
    login_as(client, "bargain_ben")
    offer = _propose_flip(client, item["id"], low=40, high=160)

    res = client.post(f"/offers/{offer['id']}/view")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["viewed_by_buyer_at"] is not None


def test_mark_view_is_buyer_only(client: TestClient, make_item, monkeypatch) -> None:
    """The seller cannot call ``POST /offers/{id}/view`` on a resolved flip."""
    from app import main as main_module

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 1, raising=True
    )

    item = make_item(price=100)
    login_as(client, "bargain_ben")
    offer = _propose_flip(client, item["id"], low=40, high=160)

    login_as(client, "seed_seller")
    res = client.post(f"/offers/{offer['id']}/view")
    assert res.status_code == 403


def test_mark_view_non_flip_400(client: TestClient, make_item) -> None:
    """Regular offers cannot be ``view``-stamped."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    res = client.post(
        "/offers", json={"item_id": item["id"], "price": 80}
    )
    assert res.status_code == 201
    offer_id = res.json()["id"]

    res = client.post(f"/offers/{offer_id}/view")
    assert res.status_code == 400


def test_mark_view_is_idempotent(client: TestClient, make_item, monkeypatch) -> None:
    """Second ``view`` returns the same ``viewed_by_buyer_at`` timestamp."""
    from app import main as main_module

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 0, raising=True
    )
    item = make_item(price=100)
    login_as(client, "bargain_ben")
    offer = _propose_flip(client, item["id"], low=40, high=160)

    first = client.post(f"/offers/{offer['id']}/view").json()
    second = client.post(f"/offers/{offer['id']}/view").json()
    assert first["viewed_by_buyer_at"] == second["viewed_by_buyer_at"]


def test_flip_on_sold_item_is_409(
    client: TestClient, make_item, monkeypatch
) -> None:
    """After a resolved flip sells the item, a second flip attempt 409s."""
    item = make_item(price=100)
    login_as(client, "bargain_ben")

    from app import main as main_module

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 0, raising=True
    )
    _propose_flip(client, item["id"], low=40, high=160)

    monkeypatch.setattr(
        main_module.secrets, "randbelow", lambda _n: 1, raising=True
    )
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "low_price": 50, "high_price": 150},
    )
    assert res.status_code == 409

