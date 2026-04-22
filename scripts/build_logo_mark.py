"""Build transparent logo-mark + wordmark assets from generated source images.

Takes raw AI-generated art (with a painted cream background), knocks the
background out, tight-crops to the subject, and exports the standard set of
assets used by ``web/src/app/layout.tsx``:

- Square mark sizes (32/64/128/256/512 + canonical ``logo-mark.png``)
- Square cream-background Apple touch icon
- Multi-resolution ``favicon.ico``
- Transparent wordmark PNG preserving aspect ratio (``--wordmark``)
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

CREAM_BG = (242, 234, 216)  # #f2ead8 — matches --background


def _sample_bg_color(arr: np.ndarray) -> np.ndarray:
    """Median of the image corners — robust to paper-grain noise."""
    corner_px = np.concatenate(
        [
            arr[:5, :5, :3].reshape(-1, 3),
            arr[:5, -5:, :3].reshape(-1, 3),
            arr[-5:, :5, :3].reshape(-1, 3),
            arr[-5:, -5:, :3].reshape(-1, 3),
        ],
        axis=0,
    )
    return np.median(corner_px, axis=0).astype(int)


def _background_mask(
    arr: np.ndarray, tol: int = 28, *, edge_only: bool = True
) -> np.ndarray:
    """Return a boolean mask of background pixels.

    When ``edge_only`` is True (default), only edge-connected regions count as
    background — interior bg-colored pixels (e.g. a cream mug body) are
    preserved. When False, *every* pixel within ``tol`` of the sampled bg
    color is marked as background, including letter counters in a wordmark.
    """
    h, w = arr.shape[:2]
    target = _sample_bg_color(arr)

    rgb = arr[..., :3].astype(int)
    diff = np.abs(rgb - target).max(axis=-1)
    bg_candidate = diff <= tol

    if not edge_only:
        return bg_candidate

    labels, _ = label(bg_candidate)

    edge_labels: set[int] = set()
    for strip in (labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]):
        edge_labels.update(int(v) for v in np.unique(strip) if v != 0)

    if not edge_labels:
        return np.zeros((h, w), dtype=bool)
    return np.isin(labels, list(edge_labels))


def _punch_enclosed_pockets(arr: np.ndarray, tol: int = 28) -> None:
    """Punch transparency through cream pockets fully enclosed by opaque pixels.

    After the initial edge-connected bg removal, interior bg-colored regions
    (e.g. a mug-handle hole) are still opaque. This finds each such region,
    dilates it, and checks whether any of the bordering pixels are already
    transparent. If the region is fully enclosed by opaque content, it's a
    pocket that should also be transparent. Regions that border the outer
    transparent area (e.g. a cream wave spilling above the mug rim) are left
    alone. Mutates ``arr`` in place.
    """
    target = _sample_bg_color(arr)
    rgb = arr[..., :3].astype(int)
    alpha = arr[..., 3]
    diff = np.abs(rgb - target).max(axis=-1)

    interior_bg = (diff <= tol) & (alpha > 0)
    if not interior_bg.any():
        return

    labels, n = label(interior_bg)
    transparent = alpha == 0

    for comp_id in range(1, n + 1):
        comp = labels == comp_id
        ring = binary_dilation(comp, iterations=2) & ~comp
        if not (ring & transparent).any():
            arr[comp, 3] = 0
            edge_band = binary_dilation(comp, iterations=1) & ~comp
            arr[edge_band, 3] = (arr[edge_band, 3].astype(int) // 2).astype(np.uint8)


def _make_transparent(
    src: Path, *, edge_only: bool = True, punch_pockets: bool = False
) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    bg_mask = _background_mask(arr, edge_only=edge_only)

    grown = binary_dilation(bg_mask, iterations=1)
    edge_band = grown & ~bg_mask
    arr[edge_band, 3] = (arr[edge_band, 3].astype(int) // 2).astype(np.uint8)
    arr[bg_mask, 3] = 0

    if punch_pockets:
        _punch_enclosed_pockets(arr)

    return Image.fromarray(arr, "RGBA")


def _tight_crop(img: Image.Image) -> Image.Image:
    """Crop to the non-transparent bounding box."""
    alpha = np.array(img.split()[-1])
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0 or len(ys) == 0:
        return img
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    return img.crop((x0, y0, x1 + 1, y1 + 1))


def _tight_square(img: Image.Image, pad_ratio: float = 0.08) -> Image.Image:
    """Crop to non-transparent bbox, then pad to a centered square canvas."""
    cropped = _tight_crop(img)
    w, h = cropped.size
    side = max(w, h)
    pad = int(side * pad_ratio)
    canvas_side = side + pad * 2

    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    canvas.paste(cropped, (pad + (side - w) // 2, pad + (side - h) // 2), cropped)
    return canvas


def _pad_rect(img: Image.Image, pad_ratio: float = 0.04) -> Image.Image:
    """Crop to content bbox then add uniform transparent padding (keeps aspect)."""
    cropped = _tight_crop(img)
    w, h = cropped.size
    pad = int(max(w, h) * pad_ratio)
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad, pad), cropped)
    return canvas


def _resize_square(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


def _on_cream(img: Image.Image, size: int, pad_ratio: float = 0.06) -> Image.Image:
    """Composite the transparent mark onto a cream square (Apple touch icon)."""
    canvas = Image.new("RGBA", (size, size), CREAM_BG + (255,))
    inner = int(size * (1 - pad_ratio * 2))
    mark = img.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.paste(mark, (off, off), mark)
    return canvas.convert("RGB")


def _build_mark(src: Path, out_dir: Path, favicon_target: Path | None) -> None:
    transparent = _make_transparent(src, punch_pockets=True)
    squared = _tight_square(transparent)

    for s in (512, 256, 128, 64, 32):
        _resize_square(squared, s).save(
            out_dir / f"logo-mark-{s}.png", "PNG", optimize=True
        )
        print(f"wrote {out_dir / f'logo-mark-{s}.png'}")

    _resize_square(squared, 512).save(out_dir / "logo-mark.png", "PNG", optimize=True)
    print(f"wrote {out_dir / 'logo-mark.png'}")

    _on_cream(squared, 512).save(
        out_dir / "logo-mark-square.png", "PNG", optimize=True
    )
    print(f"wrote {out_dir / 'logo-mark-square.png'}")

    if favicon_target is not None:
        favicon_target.parent.mkdir(parents=True, exist_ok=True)
        ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
        _resize_square(squared, 64).save(
            favicon_target, format="ICO", sizes=ico_sizes
        )
        print(f"wrote {favicon_target}")


def _build_wordmark(src: Path, out_dir: Path, target_width: int = 1024) -> None:
    transparent = _make_transparent(src, edge_only=False)
    padded = _pad_rect(transparent)

    w, h = padded.size
    scale = target_width / w
    resized = padded.resize((target_width, max(1, int(round(h * scale)))), Image.LANCZOS)
    resized.save(out_dir / "wordmark.png", "PNG", optimize=True)
    print(f"wrote {out_dir / 'wordmark.png'} ({resized.size[0]}x{resized.size[1]})")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source", nargs="?", help="Mark source PNG")
    p.add_argument("out_dir", help="Target directory (e.g. web/public)")
    p.add_argument("favicon", nargs="?", help="Optional favicon.ico target path")
    p.add_argument(
        "--wordmark",
        metavar="PATH",
        help="Wordmark source PNG; written to <out_dir>/wordmark.png",
    )
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.source:
        src = Path(args.source)
        if not src.exists():
            print(f"source not found: {src}")
            return 1
        favicon_target = Path(args.favicon) if args.favicon else None
        _build_mark(src, out_dir, favicon_target)

    if args.wordmark:
        wm = Path(args.wordmark)
        if not wm.exists():
            print(f"wordmark source not found: {wm}")
            return 1
        _build_wordmark(wm, out_dir)

    if not args.source and not args.wordmark:
        p.error("provide a mark source, --wordmark, or both")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
