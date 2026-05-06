"""Listing photo uploads.

Client-uploaded photos are validated, re-encoded to WebP (for size + format
consistency), downsized to a reasonable max dimension, and saved under a
random UUID filename. The resulting URL is what callers persist to
``items.image_url``.

In dev this writes to a local directory exposed via FastAPI's ``StaticFiles``
mount. In production this module is the single place to swap for a cloud
object store (e.g. GCS).
"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

# 8 MB hard cap on the original upload. Next.js' default body limit is ~4 MB
# and Cloud Run allows up to 32 MB per request, so 8 MB is a comfortable
# middle ground that still rejects pathological inputs quickly.
MAX_UPLOAD_BYTES = 8 * 1024 * 1024

# Largest dimension we keep. Listings render at most ~1200px wide, so 1600
# gives retina room without wasting bytes.
MAX_DIMENSION = 1600

ACCEPTED_CONTENT_TYPES = {
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
}


def save_uploaded_image(file: UploadFile, upload_dir: Path) -> str:
    """Validate, transcode, and persist an uploaded image.

    Returns:
        The basename (e.g. ``"8f…c0.webp"``) written under ``upload_dir``.
        Callers are responsible for composing the public URL.
    """
    if file.content_type and file.content_type.lower() not in ACCEPTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type: {file.content_type}",
        )

    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty upload.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image is too big. Max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    try:
        img = Image.open(BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=400, detail="File is not a readable image."
        ) from exc

    # Preserve transparency where the source supports it (PNG, WebP); flatten
    # other modes to RGB so WebP doesn't complain.
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.mode else "RGB")

    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}.webp"
    out_path = upload_dir / filename
    img.save(out_path, format="WEBP", quality=85, method=6)
    return filename
