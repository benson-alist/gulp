"""Knock out the painted background on the category PNGs.

The image model sometimes returns a solid white background or a faux-
transparency checkerboard instead of real alpha.  This script identifies
background pixels (low saturation + high brightness) that are connected
to the image edges and sets them transparent, while preserving interior
whites (foam, highlights, cream mug body, etc.).
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label


def knockout(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)

    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    saturation = max_c - min_c

    # Background candidates: any desaturated pixel (any gray).  We rely on the
    # subject's closed ink outline to separate these from the (also desaturated)
    # cream body / foam / highlights inside the shape.
    background_candidate = (saturation <= 25) & (max_c >= 45)

    labels, _ = label(background_candidate)

    edge_labels = set()
    for strip in (labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]):
        edge_labels.update(int(v) for v in np.unique(strip) if v != 0)

    if not edge_labels:
        print(f"{path.name}: no edge-connected background found, skipping")
        return

    bg_mask = np.isin(labels, list(edge_labels))

    # Feather the edge by 1px so anti-aliased rim pixels fade out.
    grown = binary_dilation(bg_mask, iterations=1)
    edge_band = grown & ~bg_mask
    arr[edge_band, 3] = (arr[edge_band, 3].astype(int) // 2).astype(np.uint8)

    arr[bg_mask, 3] = 0

    Image.fromarray(arr, "RGBA").save(path, "PNG", optimize=True)
    removed = int(bg_mask.sum())
    total = bg_mask.size
    print(f"{path.name}: removed {removed}/{total} bg px ({removed / total:.1%})")


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: knockout_bg.py <png> [<png> ...]")
        return 1
    for raw in sys.argv[1:]:
        p = Path(raw)
        if not p.exists():
            print(f"skip (missing): {p}")
            continue
        knockout(p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
