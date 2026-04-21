"""Tests for `/offers` — claim semantics, sold-item guard, offer ceiling."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_claim_marks_item_sold(client: TestClient, make_item) -> None:
    """Omitting `price` claims at asking and flips `is_sold` to true."""
    item = make_item(price=25)

    res = client.post(
        "/offers",
        json={"item_id": item["id"], "buyer_username": "shelf_saver"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["kind"] == "claim"
    assert body["status"] == "claimed"
    assert body["price"] == 25

    fetched = client.get(f"/items/{item['id']}").json()
    assert fetched["is_sold"] is True


def test_second_claim_rejected_with_409(client: TestClient, make_item) -> None:
    """Once an item is sold, further claims/offers 409."""
    item = make_item(price=25)
    client.post(
        "/offers",
        json={"item_id": item["id"], "buyer_username": "shelf_saver"},
    ).raise_for_status()

    res = client.post(
        "/offers",
        json={"item_id": item["id"], "buyer_username": "late_latte"},
    )
    assert res.status_code == 409
    assert "already found a cupboard" in res.json()["detail"]


def test_offer_below_asking_recorded(client: TestClient, make_item) -> None:
    """Lower offers are stored with `kind=offer`, `status=awaiting_seller`."""
    item = make_item(price=25)

    res = client.post(
        "/offers",
        json={
            "item_id": item["id"],
            "buyer_username": "bargain_ben",
            "price": 18,
            "message": "My cupboard is a museum.",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["kind"] == "offer"
    assert body["status"] == "awaiting_seller"
    assert body["price"] == 18
    assert body["message"] == "My cupboard is a museum."

    fetched = client.get(f"/items/{item['id']}").json()
    assert fetched["is_sold"] is False


def test_offer_equal_to_asking_rejected(client: TestClient, make_item) -> None:
    """An offer at the asking price is a UX bug — reject with 400."""
    item = make_item(price=25)
    res = client.post(
        "/offers",
        json={
            "item_id": item["id"],
            "buyer_username": "mirror_mike",
            "price": 25,
        },
    )
    assert res.status_code == 400
    assert "below the asking price" in res.json()["detail"]


def test_offer_above_asking_rejected(client: TestClient, make_item) -> None:
    """Offers above asking would be silly; also 400."""
    item = make_item(price=25)
    res = client.post(
        "/offers",
        json={
            "item_id": item["id"],
            "buyer_username": "over_tom",
            "price": 30,
        },
    )
    assert res.status_code == 400


def test_offer_on_missing_item_404(client: TestClient) -> None:
    """Non-existent item produces the signature 404."""
    res = client.post(
        "/offers",
        json={"item_id": 99999, "buyer_username": "ghost_buyer"},
    )
    assert res.status_code == 404


def test_offer_bad_handle_422(client: TestClient, make_item) -> None:
    """Buyer handles are validated by the schema just like seller handles."""
    item = make_item()
    res = client.post(
        "/offers",
        json={"item_id": item["id"], "buyer_username": "x"},  # too short
    )
    assert res.status_code == 422


def test_list_offers_newest_first(client: TestClient, make_item) -> None:
    """`/offers` returns recent offers, newest first."""
    item = make_item(price=30)
    for buyer, price in [("a_one", 10), ("b_two", 15), ("c_three", 20)]:
        client.post(
            "/offers",
            json={
                "item_id": item["id"],
                "buyer_username": buyer,
                "price": price,
            },
        ).raise_for_status()

    rows = client.get("/offers").json()
    assert len(rows) == 3
    prices = [r["price"] for r in rows]
    # Newest-first: last inserted (20) should come first.
    assert prices[0] == 20
    assert prices[-1] == 10
