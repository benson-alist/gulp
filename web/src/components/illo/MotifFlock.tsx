import type { CSSProperties } from "react";
import MotifSticker from "./MotifSticker";
import { computeArtStickerPlacements } from "@/lib/listingArtPlacements";

/**
 * Decorative cluster of 1–4 small {@link MotifSticker}s scattered around the
 * surrounding photo well. Every choice — count, motif kinds, palette, rotation,
 * size, slot — is derived from a stable `seed` (typically `item.id`), so the
 * same listing always wears the same stickers across reloads and across users.
 *
 * Place inside an element with `position: relative`. The flock fills the
 * whole inset and is `pointer-events: none` so it never steals clicks.
 *
 * Two listings sharing the same stock photo will end up looking visibly
 * different because their seeds disagree, which is the whole point.
 */
export default function MotifFlock({
  seed,
  count: explicit,
  baseSize = 38,
  className = "",
}: {
  /** Stable seed (use `item.id`) so the layout doesn't reshuffle on reloads. */
  seed: number;
  /** Override the deterministic count. Clamped to 0..4. */
  count?: number;
  /** Smallest sticker size in px; each motif may grow up to ~+12 px. */
  baseSize?: number;
  className?: string;
}) {
  const placements = computeArtStickerPlacements(seed, {
    explicitCount: explicit,
    baseSize,
  });

  if (placements.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[2] ${className}`}
      aria-hidden
    >
      {placements.map((p, i) => (
        <span key={i} className="absolute" style={p.slot as CSSProperties}>
          <MotifSticker
            kind={p.kind}
            tone={p.tone}
            size={p.size}
            rotate={p.rotate}
          />
        </span>
      ))}
    </div>
  );
}
