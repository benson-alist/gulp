import type { CSSProperties } from "react";
import MotifSticker, { MOTIF_KINDS, type MotifKind } from "./MotifSticker";
import { STICKER_TONES, type StickerTone } from "./stickerTones";

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

/**
 * Tiny seeded PRNG (mulberry32 variant). Good enough for visual scattering;
 * absolutely not for security. We hash the seed once with a Knuth multiplier
 * so adjacent IDs don't produce visually adjacent layouts.
 */
function rngFrom(seed: number): () => number {
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
 * Eight perimeter slots. We deliberately avoid the four extreme corners
 * because `ItemCard` and the listing hero already pin functional badges
 * (drinkware type, discount %, shelf time) into those corners. Slots are
 * percentage-based so they scale with the photo well's actual size.
 */
const SLOTS: readonly CSSProperties[] = [
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
 * Weighted distribution: most listings get 1–2 stickers, a few get 3, and the
 * occasional cup gets the full 4-sticker treatment. Keeps galleries readable.
 */
function pickCount(rng: () => number): number {
  const r = rng();
  if (r < 0.45) return 1;
  if (r < 0.75) return 2;
  if (r < 0.93) return 3;
  return 4;
}

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
  const rng = rngFrom(seed);
  const count =
    explicit !== undefined ? Math.max(0, Math.min(4, explicit)) : pickCount(rng);

  // Fisher–Yates over slot indices so each placement gets a distinct slot.
  const slotIdx = SLOTS.map((_, i) => i);
  for (let i = slotIdx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [slotIdx[i], slotIdx[j]] = [slotIdx[j], slotIdx[i]];
  }

  const placements = Array.from({ length: count }).map((_, i) => {
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
      slot: SLOTS[slotIdx[i] ?? i % SLOTS.length],
    };
  });

  if (placements.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[2] ${className}`}
      aria-hidden
    >
      {placements.map((p, i) => (
        <span key={i} className="absolute" style={p.slot}>
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
