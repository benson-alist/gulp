"""Tests for the `/items` endpoints — create, fetch, filter, sort, paginate."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.conftest import item_payload, login_as


def test_health(client: TestClient) -> None:
    """`/health` returns the liveness payload with the brand slogan."""
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "gulp-api"


def test_create_and_fetch_item(client: TestClient, make_item) -> None:
    """Creating an item as ``seed_seller`` round-trips correctly."""
    created = make_item(title="Dusty Stein", price=12, original_price=40)
    assert created["id"] > 0
    assert created["seller"]["username"] == "seed_seller"
    assert created["price"] == 12
    assert created["original_price"] == 40
    assert created["is_sold"] is False

    fetched = client.get(f"/items/{created['id']}").json()
    assert fetched["id"] == created["id"]
    assert fetched["title"] == "Dusty Stein"


def test_get_item_404(client: TestClient) -> None:
    """Unknown ids produce the signature 404 copy."""
    res = client.get("/items/999999")
    assert res.status_code == 404
    assert "missing from its saucer" in res.json()["detail"]


def test_items_pagination_and_total(client: TestClient, make_item) -> None:
    """`/items` returns a page envelope with total, limit, and offset."""
    for i in range(5):
        make_item(title=f"Mug #{i}")

    page1 = client.get("/items?limit=2&offset=0").json()
    assert page1["total"] == 5
    assert page1["limit"] == 2
    assert page1["offset"] == 0
    assert len(page1["items"]) == 2

    page3 = client.get("/items?limit=2&offset=4").json()
    assert page3["total"] == 5
    assert page3["offset"] == 4
    assert len(page3["items"]) == 1


def test_items_sort_price_asc(client: TestClient, make_item) -> None:
    """`sort=price_asc` returns cheapest first."""
    make_item(title="Cheap", price=5)
    make_item(title="Mid", price=10)
    make_item(title="Spendy", price=40)

    res = client.get("/items?sort=price_asc").json()
    prices = [i["price"] for i in res["items"]]
    assert prices == sorted(prices)


def test_items_filter_by_drinkware_type(client: TestClient, make_item) -> None:
    """Filtering by drinkware_type excludes other categories."""
    make_item(title="Mug one", drinkware_type="mug")
    make_item(title="Bottle one", drinkware_type="water_bottle")

    res = client.get("/items?drinkware_type=mug").json()
    assert res["total"] == 1
    assert res["items"][0]["drinkware_type"] == "mug"


def test_items_search_query(client: TestClient, make_item) -> None:
    """Free-text `q` matches across title, brand, and colorway."""
    make_item(title="World's Best Dad Mug", brand="Hallmarko")
    make_item(title="Conference Swag", brand="DevCon")

    res = client.get("/items?q=swag").json()
    assert res["total"] == 1
    assert "Conference" in res["items"][0]["title"]


def test_items_reject_bad_sort(client: TestClient) -> None:
    """Unknown sort keys 422 at the query-param validator."""
    res = client.get("/items?sort=lollipop")
    assert res.status_code == 422


def test_item_create_rejects_bad_enum(client: TestClient) -> None:
    """Bogus drinkware_type is rejected by Pydantic before the DB sees it."""
    login_as(client, "seed_seller")
    res = client.post("/items", json=item_payload(drinkware_type="teapot"))
    assert res.status_code == 422


def test_item_create_requires_authentication(client: TestClient) -> None:
    """``POST /items`` without a session cookie returns 401."""
    res = client.post("/items", json=item_payload())
    assert res.status_code == 401


@pytest.mark.parametrize("shame", [0, 11])
def test_item_create_rejects_shame_out_of_range(
    client: TestClient, shame: int
) -> None:
    """`shame_index` is clamped to 1..10."""
    login_as(client, "seed_seller")
    res = client.post("/items", json=item_payload(shame_index=shame))
    assert res.status_code == 422


def test_stats_aggregates(client: TestClient, make_item) -> None:
    """`/stats` reflects created items and their aggregates."""
    make_item(price=10, years_in_cupboard=3, shame_index=8)
    make_item(price=20, years_in_cupboard=2, shame_index=4)

    body = client.get("/stats").json()
    assert body["total_items"] == 2
    assert body["cupboard_years_liberated"] == 5
    assert body["value_liberated_usd"] == 30.0
    assert body["average_shame"] == 6.0


def test_item_types_counts(client: TestClient, make_item) -> None:
    """`/items/types` groups by category, most populous first."""
    make_item(drinkware_type="mug")
    make_item(drinkware_type="mug")
    make_item(drinkware_type="shot_glass")

    rows = client.get("/items/types").json()
    assert rows[0] == {"drinkware_type": "mug", "count": 2}
