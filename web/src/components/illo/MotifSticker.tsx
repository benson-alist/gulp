import type { ReactElement, ReactNode } from "react";
import { TONE_BG, type StickerTone } from "./stickerTones";

/**
 * Tiny illustrated motifs you can slap on a listing photo as decals.
 *
 * Each motif is a hand-drawn SVG icon themed via the {@link StickerTone}
 * palette (`tone` selects the fill colour for the dominant shape; outlines
 * always use `var(--foreground)` so they read in both light + dark themes).
 *
 * Pair with {@link "./MotifFlock"} to scatter 1–4 of these across a
 * thumbnail — the fingerprint there is deterministic per `item.id` so the
 * same listing always wears the same stickers.
 *
 * Themes covered:
 *
 * - **Cup-y:** mug_mini · latte_heart · espresso_shot · boba_cup
 * - **Funny:** coffee_stain · fire_flame · comic_zap · crying_laugh
 * - **Anime / manga:** kawaii_face · onigiri · sparkle_eye · speed_lines
 * - **Cartoon:** pow_burst · googly_eyes · lightning_bolt · splat
 * - **Sports:** basketball · trophy_cup · medal_first · whistle
 */
export type MotifKind =
  | "mug_mini"
  | "latte_heart"
  | "espresso_shot"
  | "boba_cup"
  | "coffee_stain"
  | "fire_flame"
  | "comic_zap"
  | "crying_laugh"
  | "kawaii_face"
  | "onigiri"
  | "sparkle_eye"
  | "speed_lines"
  | "pow_burst"
  | "googly_eyes"
  | "lightning_bolt"
  | "splat"
  | "basketball"
  | "trophy_cup"
  | "medal_first"
  | "whistle";

/** Stable order — used by the flock fingerprint to index by hash. */
export const MOTIF_KINDS: readonly MotifKind[] = [
  "mug_mini",
  "latte_heart",
  "espresso_shot",
  "boba_cup",
  "coffee_stain",
  "fire_flame",
  "comic_zap",
  "crying_laugh",
  "kawaii_face",
  "onigiri",
  "sparkle_eye",
  "speed_lines",
  "pow_burst",
  "googly_eyes",
  "lightning_bolt",
  "splat",
  "basketball",
  "trophy_cup",
  "medal_first",
  "whistle",
] as const;

// Espresso brown — kept as a literal because in dark mode `var(--foreground)`
// flips to cream, which would render coffee crema as foam. Decorative-only.
const COFFEE = "#3a1f15";

/**
 * Resolved ink colours for motif interiors (foreground stroke, cream accent
 * blobs, blush / sky ribbons). Pass CSS tokens on screen; pass literal hex when
 * rasterizing to PNG so {@link XMLSerializer} output stays portable.
 */
export type MotifPalette = {
  stroke: string;
  cream: string;
  blush: string;
  sky: string;
};

/** Palette wired to global CSS tokens — default for interactive / DOM decals. */
export function motifPaletteFromCssVars(): MotifPalette {
  return {
    stroke: "var(--foreground)",
    cream: "var(--accent-ink)",
    blush: "var(--ink-blush)",
    sky: "var(--ink-sky)",
  };
}

type MotifDrawProps = { tint: string } & MotifPalette;

/**
 * Common SVG group: children inherit stroke + line cap for hand-drawn outlines.
 */
function MotifDrawGroup({
  stroke,
  children,
}: {
  stroke: string;
  children: ReactNode;
}) {
  return (
    <g
      style={{
        stroke,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      }}
    >
      {children}
    </g>
  );
}

const MOTIF_BODIES: Record<MotifKind, (p: MotifDrawProps) => ReactElement> = {
  // ── Cup-themed ────────────────────────────────────────────────
  mug_mini: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <path d="M32 20 Q40 20 40 26 Q40 32 32 32" fill="none" strokeWidth="2.5" />
      <rect
        x="8"
        y="14"
        width="24"
        height="22"
        rx="3"
        style={{ fill: tint }}
        strokeWidth="2.5"
      />
      <path d="M14 10 Q16 6 14 2" fill="none" strokeWidth="2" />
      <path d="M22 10 Q24 6 22 2" fill="none" strokeWidth="2" />
      <path d="M30 10 Q32 6 30 2" fill="none" strokeWidth="2" />
    </MotifDrawGroup>
  ),
  latte_heart: ({ tint, stroke, cream }) => (
    <MotifDrawGroup stroke={stroke}>
      <ellipse
        cx="24"
        cy="40"
        rx="17"
        ry="3"
        style={{ fill: tint, opacity: 0.7 }}
        strokeWidth="1.5"
      />
      <circle cx="24" cy="22" r="14" style={{ fill: tint }} strokeWidth="2.5" />
      <circle cx="24" cy="22" r="10" style={{ fill: cream }} strokeWidth="0" />
      <path
        d="M24 30 C 17 23, 17 15, 21 15 C 23 15, 24 17, 24 17 C 24 17, 25 15, 27 15 C 31 15, 31 23, 24 30 Z"
        style={{ fill: tint }}
        strokeWidth="0"
      />
    </MotifDrawGroup>
  ),
  espresso_shot: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <ellipse
        cx="24"
        cy="40"
        rx="14"
        ry="2.5"
        style={{ fill: tint, opacity: 0.7 }}
        strokeWidth="1.5"
      />
      <path d="M34 22 Q40 22 40 28 Q40 34 34 34" fill="none" strokeWidth="2.5" />
      <path
        d="M14 18 L34 18 L31 36 L17 36 Z"
        style={{ fill: tint }}
        strokeWidth="2.5"
      />
      <ellipse
        cx="24"
        cy="20"
        rx="9"
        ry="2"
        style={{ fill: COFFEE }}
        strokeWidth="0"
      />
    </MotifDrawGroup>
  ),
  boba_cup: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <rect
        x="22"
        y="2"
        width="4"
        height="14"
        rx="1"
        style={{ fill: stroke }}
        strokeWidth="0"
      />
      <ellipse cx="24" cy="12" rx="12" ry="3" style={{ fill: tint }} strokeWidth="2" />
      <path
        d="M12 12 L36 12 L33 42 L15 42 Z"
        style={{ fill: tint }}
        fillOpacity="0.55"
        strokeWidth="2.5"
      />
      <circle cx="20" cy="35" r="2" style={{ fill: stroke }} strokeWidth="0" />
      <circle cx="25" cy="38" r="2" style={{ fill: stroke }} strokeWidth="0" />
      <circle cx="29" cy="33" r="2" style={{ fill: stroke }} strokeWidth="0" />
    </MotifDrawGroup>
  ),

  // ── Funny ─────────────────────────────────────────────────────
  coffee_stain: (p: MotifDrawProps) => {
    void p;
    return (
    <g style={{ strokeLinejoin: "round", strokeLinecap: "round" }}>
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        strokeWidth="3"
        style={{ stroke: COFFEE, opacity: 0.55 }}
      />
      <circle
        cx="24"
        cy="24"
        r="12"
        fill="none"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        style={{ stroke: COFFEE, opacity: 0.45 }}
      />
      <circle
        cx="38"
        cy="14"
        r="2"
        style={{ fill: COFFEE, opacity: 0.5 }}
        strokeWidth="0"
      />
      <circle
        cx="10"
        cy="36"
        r="1.5"
        style={{ fill: COFFEE, opacity: 0.5 }}
        strokeWidth="0"
      />
    </g>
    );
  },
  fire_flame: ({ tint, stroke, cream }) => (
    <MotifDrawGroup stroke={stroke}>
      <path
        d="M24 4 Q30 12 32 18 Q40 24 36 34 Q32 44 24 44 Q12 44 10 32 Q9 24 16 18 Q22 12 18 6 Q22 8 24 4 Z"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <path
        d="M24 18 Q26 22 27 26 Q28 32 24 38 Q20 38 19 32 Q19 26 22 22 Z"
        style={{ fill: cream, opacity: 0.7 }}
        strokeWidth="0"
      />
    </MotifDrawGroup>
  ),
  comic_zap: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <polygon
        points="24,2 32,10 44,8 38,18 48,24 38,30 44,42 32,38 24,46 16,38 4,42 10,30 0,24 10,18 4,8 16,10"
        style={{ fill: tint }}
        strokeWidth="2"
      />
    </MotifDrawGroup>
  ),
  crying_laugh: ({ tint, stroke, sky }) => (
    <MotifDrawGroup stroke={stroke}>
      <circle cx="24" cy="24" r="18" style={{ fill: tint }} strokeWidth="2" />
      <path d="M14 20 Q16 16 18 20" fill="none" strokeWidth="2.5" />
      <path d="M30 20 Q32 16 34 20" fill="none" strokeWidth="2.5" />
      <path
        d="M16 28 Q24 36 32 28 Q24 32 16 28 Z"
        style={{ fill: stroke }}
        strokeWidth="2"
      />
      <path
        d="M10 22 Q8 28 10 32 Q12 28 10 22 Z"
        style={{ fill: sky }}
        strokeWidth="1.5"
      />
      <path
        d="M38 22 Q40 28 38 32 Q36 28 38 22 Z"
        style={{ fill: sky }}
        strokeWidth="1.5"
      />
    </MotifDrawGroup>
  ),

  // ── Anime / manga ─────────────────────────────────────────────
  kawaii_face: ({ tint, stroke, blush }) => (
    <MotifDrawGroup stroke={stroke}>
      <circle cx="24" cy="24" r="18" style={{ fill: tint }} strokeWidth="2" />
      <path d="M13 22 L17 18 L21 22" fill="none" strokeWidth="2.5" />
      <path d="M27 22 L31 18 L35 22" fill="none" strokeWidth="2.5" />
      <path d="M18 30 Q24 36 30 30" fill="none" strokeWidth="2.5" />
      <ellipse
        cx="13"
        cy="29"
        rx="2.5"
        ry="1.5"
        style={{ fill: blush, opacity: 0.85 }}
        strokeWidth="0"
      />
      <ellipse
        cx="35"
        cy="29"
        rx="2.5"
        ry="1.5"
        style={{ fill: blush, opacity: 0.85 }}
        strokeWidth="0"
      />
    </MotifDrawGroup>
  ),
  onigiri: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <path
        d="M24 6 Q26 6 28 9 L40 36 Q42 41 36 41 L12 41 Q6 41 8 36 L20 9 Q22 6 24 6 Z"
        style={{ fill: tint }}
        strokeWidth="2.5"
      />
      <path
        d="M14 30 L34 30 L34 36 Q34 38 32 38 L16 38 Q14 38 14 36 Z"
        style={{ fill: stroke }}
        strokeWidth="0"
      />
      <ellipse cx="19" cy="22" rx="1.8" ry="2.5" style={{ fill: stroke }} strokeWidth="0" />
      <ellipse cx="29" cy="22" rx="1.8" ry="2.5" style={{ fill: stroke }} strokeWidth="0" />
      <path d="M22 27 Q24 29 26 27" fill="none" strokeWidth="1.8" />
    </MotifDrawGroup>
  ),
  sparkle_eye: ({ tint, stroke, cream }) => (
    <MotifDrawGroup stroke={stroke}>
      <path
        d="M24 2 L27 18 L44 24 L27 30 L24 46 L21 30 L4 24 L21 18 Z"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <circle cx="40" cy="8" r="2" style={{ fill: cream }} strokeWidth="0" />
      <circle cx="8" cy="40" r="1.5" style={{ fill: cream }} strokeWidth="0" />
    </MotifDrawGroup>
  ),
  speed_lines: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <line x1="24" y1="0" x2="24" y2="10" strokeWidth="3" />
      <line x1="24" y1="38" x2="24" y2="48" strokeWidth="3" />
      <line x1="0" y1="24" x2="10" y2="24" strokeWidth="3" />
      <line x1="38" y1="24" x2="48" y2="24" strokeWidth="3" />
      <line x1="6" y1="6" x2="14" y2="14" strokeWidth="2.5" />
      <line x1="34" y1="34" x2="42" y2="42" strokeWidth="2.5" />
      <line x1="42" y1="6" x2="34" y2="14" strokeWidth="2.5" />
      <line x1="14" y1="34" x2="6" y2="42" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="6" style={{ fill: tint }} strokeWidth="2" />
    </MotifDrawGroup>
  ),

  // ── Cartoon ───────────────────────────────────────────────────
  pow_burst: ({ tint, stroke, cream }) => (
    <MotifDrawGroup stroke={stroke}>
      <polygon
        points="24,2 30,10 40,6 36,16 46,20 38,26 46,38 32,34 28,46 22,36 12,46 14,32 4,38 8,26 0,20 10,16 6,6 16,10 18,2"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <circle cx="24" cy="22" r="3.5" style={{ fill: cream }} strokeWidth="0" />
    </MotifDrawGroup>
  ),
  googly_eyes: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <circle cx="14" cy="24" r="10" style={{ fill: tint }} strokeWidth="2" />
      <circle cx="16" cy="22" r="4" style={{ fill: stroke }} strokeWidth="0" />
      <circle cx="34" cy="24" r="10" style={{ fill: tint }} strokeWidth="2" />
      <circle cx="32" cy="26" r="4" style={{ fill: stroke }} strokeWidth="0" />
    </MotifDrawGroup>
  ),
  lightning_bolt: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <polygon
        points="22,4 12,26 20,26 16,44 36,20 26,20 32,4"
        style={{ fill: tint }}
        strokeWidth="2"
      />
    </MotifDrawGroup>
  ),
  splat: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <path
        d="M24 6 Q22 16 14 14 Q4 12 4 22 Q4 32 14 30 Q12 38 20 42 Q28 46 32 38 Q40 42 44 34 Q48 26 40 22 Q46 14 38 10 Q30 4 24 6 Z"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <circle cx="44" cy="14" r="2" style={{ fill: tint }} strokeWidth="1.5" />
      <circle cx="6" cy="40" r="1.5" style={{ fill: tint }} strokeWidth="1.5" />
    </MotifDrawGroup>
  ),

  // ── Sports ────────────────────────────────────────────────────
  basketball: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <circle cx="24" cy="24" r="18" style={{ fill: tint }} strokeWidth="2" />
      <line x1="24" y1="6" x2="24" y2="42" strokeWidth="1.5" />
      <line x1="6" y1="24" x2="42" y2="24" strokeWidth="1.5" />
      <path d="M9 14 Q24 19 39 14" fill="none" strokeWidth="1.5" />
      <path d="M9 34 Q24 29 39 34" fill="none" strokeWidth="1.5" />
    </MotifDrawGroup>
  ),
  trophy_cup: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <path d="M14 18 Q6 18 6 26 Q6 32 14 32" fill="none" strokeWidth="2.5" />
      <path d="M34 18 Q42 18 42 26 Q42 32 34 32" fill="none" strokeWidth="2.5" />
      <path
        d="M14 12 L34 12 L32 30 Q32 36 24 36 Q16 36 16 30 Z"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <line x1="24" y1="36" x2="24" y2="42" strokeWidth="3" />
      <rect
        x="14"
        y="42"
        width="20"
        height="4"
        rx="1"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <polygon
        points="24,16 26,21 31,21 27,24 28,29 24,26 20,29 21,24 17,21 22,21"
        style={{ fill: stroke }}
        strokeWidth="0"
      />
    </MotifDrawGroup>
  ),
  medal_first: ({ tint, stroke, sky, blush }) => (
    <MotifDrawGroup stroke={stroke}>
      <polygon
        points="14,2 22,2 18,18 12,18"
        style={{ fill: sky }}
        strokeWidth="1.5"
      />
      <polygon
        points="26,2 34,2 36,18 30,18"
        style={{ fill: blush }}
        strokeWidth="1.5"
      />
      <circle cx="24" cy="32" r="12" style={{ fill: tint }} strokeWidth="2" />
      <polygon
        points="24,26 26,30 30,30 27,33 28,37 24,35 20,37 21,33 18,30 22,30"
        style={{ fill: stroke }}
        strokeWidth="0"
      />
    </MotifDrawGroup>
  ),
  whistle: ({ tint, stroke }) => (
    <MotifDrawGroup stroke={stroke}>
      <path
        d="M2 24 L8 22 L8 30 L2 28 Z"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <path
        d="M8 20 L34 20 L36 28 L34 32 L8 32 Z"
        style={{ fill: tint }}
        strokeWidth="2"
      />
      <circle cx="22" cy="22" r="1.5" style={{ fill: stroke }} strokeWidth="0" />
      <path d="M36 24 Q42 18 44 12" fill="none" strokeWidth="2" />
      <circle cx="44" cy="12" r="3" fill="none" strokeWidth="2" />
    </MotifDrawGroup>
  ),
};

/**
 * Vector interior for a single motif (no outer ``<span>`` or shadow) — embed
 * inside a parent SVG for listing-art raster export.
 */
export function MotifStickerSvgBody({
  kind,
  tint,
  palette,
}: {
  kind: MotifKind;
  tint: string;
  palette: MotifPalette;
}) {
  const Body = MOTIF_BODIES[kind];
  return <Body tint={tint} {...palette} />;
}

/**
 * Render a single motif sticker.
 *
 * @param kind     One of the {@link MotifKind} variants.
 * @param tone     Palette key from {@link StickerTone}; controls the dominant
 *                 fill colour. Outlines stay foreground-themed.
 * @param size     Outer width / height in pixels (default 40).
 * @param rotate   Degrees of rotation applied to the whole sticker.
 */
export default function MotifSticker({
  kind,
  tone = "accent",
  size = 40,
  rotate = 0,
  className = "",
}: {
  kind: MotifKind;
  tone?: StickerTone;
  size?: number;
  rotate?: number;
  className?: string;
}) {
  const palette = motifPaletteFromCssVars();
  return (
    <span
      className={`relative inline-block select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(2px 2px 0 var(--foreground))",
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 48 48"
        width="100%"
        height="100%"
        style={{ display: "block", overflow: "visible" }}
      >
        <MotifStickerSvgBody kind={kind} tint={TONE_BG[tone]} palette={palette} />
      </svg>
    </span>
  );
}
