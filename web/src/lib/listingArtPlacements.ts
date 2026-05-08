import type { CSSProperties } from "react";
import type { MotifKind } from "@/components/illo/MotifSticker";
import { MOTIF_KINDS } from "@/components/illo/MotifSticker";
import { STICKER_TONES, type StickerTone } from "@/components/illo/stickerTones";

/**
 * Finger-printed scatter layout shared by {@link MotifFlock} (DOM) and
 * {@link GeneratedListingArtSvg} (single SVG export) so stickers land in the
 * same relative positions for a given numeric seed.
 */

export type ArtStickerPlacement = {
  kind: MotifKind;
  tone: StickerTone;
  rotate: number;
  size: number;
  slot: CSSProperties;
};

/**
 * Tiny seeded PRNG (mulberry32 variant). Good enough for visual scattering;
 * not for security.
 */
export function rngFrom(seed: number): () => number {
  let h = (seed * 2654435761) >>> 0 || 1;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Weighted sticker count: most listings wear 1–2 decals; 3–4 are rarer.
 */
export function pickStickerCount(rng: () => number): number {
  const r = rng();
  if (r < 0.45) return 1;
  if (r < 0.75) return 2;
  if (r < 0.93) return 3;
  return 4;
}

/** Same eight slots as {@link MotifFlock} — avoids corner badges on cards. */
export const ART_STICKER_SLOTS: readonly CSSProperties[] = [
  { top: "6%", left: "30%" },
  { top: "6%", left: "62%" },
  { right: "4%", top: "32%" },
  { right: "4%", bottom: "30%" },
  { bottom: "6%", left: "60%" },
  { bottom: "6%", left: "28%" },
  { left: "4%", bottom: "30%" },
  { left: "4%", top: "32%" },
];

/**
 * Build a shuffled list of motif placements for a seed.
 *
 * @param seed           Unsigned 32-bit-ish fingerprint (e.g. hash of title).
 * @param explicitCount  When set (0–4), skips random count selection.
 * @param baseSize       Pixel-ish span for each sticker (DOM) or vb-units (SVG).
 */
export function computeArtStickerPlacements(
  seed: number,
  options: { explicitCount?: number; baseSize?: number } = {},
): ArtStickerPlacement[] {
  const rng = rngFrom(seed);
  const baseSize = options.baseSize ?? 38;
  const count =
    options.explicitCount !== undefined
      ? Math.max(0, Math.min(4, options.explicitCount))
      : pickStickerCount(rng);

  const slotIdx = ART_STICKER_SLOTS.map((_, i) => i);
  for (let i = slotIdx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [slotIdx[i], slotIdx[j]] = [slotIdx[j], slotIdx[i]];
  }

  return Array.from({ length: count }).map((_, i) => {
    const kind: MotifKind =
      MOTIF_KINDS[Math.floor(rng() * MOTIF_KINDS.length)];
    const tone: StickerTone =
      STICKER_TONES[Math.floor(rng() * STICKER_TONES.length)];
    const rotate = Math.round((rng() * 2 - 1) * 18);
    const size = baseSize + Math.floor(rng() * 12);
    return {
      kind,
      tone,
      rotate,
      size,
      slot: ART_STICKER_SLOTS[slotIdx[i] ?? i % ART_STICKER_SLOTS.length],
    };
  });
}

const pct = (v: string | number | undefined) => {
  if (v === undefined) return NaN;
  return parseFloat(String(v)) / 100;
};

/**
 * Converts a CSS percentage slot (as used by {@link ART_STICKER_SLOTS}) into
 * the top-left corner of a ``size``×``size`` sticker box in viewBox space.
 */
export function artSlotTopLeft(
  slot: CSSProperties,
  size: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  let x = 0;
  let y = 0;
  if (slot.left !== undefined) x = pct(slot.left) * viewW;
  if (slot.right !== undefined) x = viewW - pct(slot.right) * viewW - size;
  if (slot.top !== undefined) y = pct(slot.top) * viewH;
  if (slot.bottom !== undefined) y = viewH - pct(slot.bottom) * viewH - size;
  return { x, y };
}
