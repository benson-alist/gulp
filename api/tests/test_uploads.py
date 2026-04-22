"""Tests for ``POST /uploads/image``.

These cover the happy path (valid PNG round-trips to a WebP at a stable
``/uploads/...`` URL) plus the two reject cases a browser realistically
triggers (wrong content type, non-image bytes).
"""
from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import settings


@pytest.fixture(autouse=True)
def _isolated_upload_dir(tmp_path, monkeypatch):
    """Redirect uploads to a per-test temp dir so nothing lands in api/uploads/."""
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


def _png_bytes(color: tuple[int, int, int] = (255, 0, 0)) -> bytes:
    img = Image.new("RGB", (32, 32), color)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_upload_image_returns_absolute_url(client: TestClient):
    res = client.post(
        "/uploads/image",
        files={"file": ("mug.png", _png_bytes(), "image/png")},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert "url" in body
    url: str = body["url"]
    assert url.startswith("http")
    assert "/uploads/" in url
    assert url.endswith(".webp")


def test_upload_image_can_be_used_on_a_listing(client: TestClient, make_item):
    res = client.post(
        "/uploads/image",
        files={"file": ("mug.png", _png_bytes(), "image/png")},
    )
    url = res.json()["url"]
    item = make_item(image_url=url)
    assert item["image_url"] == url


def test_upload_image_rejects_non_image_content_type(client: TestClient):
    res = client.post(
        "/uploads/image",
        files={"file": ("notes.txt", b"not a picture", "text/plain")},
    )
    assert res.status_code == 415


def test_upload_image_rejects_garbage_bytes(client: TestClient):
    res = client.post(
        "/uploads/image",
        files={"file": ("fake.png", b"definitely not png", "image/png")},
    )
    assert res.status_code == 400


def test_upload_image_rejects_empty_file(client: TestClient):
    res = client.post(
        "/uploads/image",
        files={"file": ("empty.png", b"", "image/png")},
    )
    assert res.status_code == 400
