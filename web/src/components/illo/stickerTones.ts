/**
 * Shared color palette for the illustrated sticker components.
 *
 * Each tone resolves to a pair of CSS custom properties: a fill (`bg`) and
 * a contrasting ink (`ink`) that's legible on top of the fill in both
 * light and dark themes. The tokens themselves come from
 * ``web/src/app/globals.css`` so theme switching just works.
 *
 * Keep this module independent (no JSX) so non-component utilities can
 * import it without dragging React in.
 */

export type StickerTone =
  | "accent"
  | "foreground"
  | "mustard"
  | "plum"
  | "sky"
  | "blush";

/** Background CSS variable for each tone. */
export const TONE_BG: Record<StickerTone, string> = {
  accent: "var(--accent)",
  foreground: "var(--foreground)",
  mustard: "var(--ink-mustard)",
  plum: "var(--ink-plum)",
  sky: "var(--ink-sky)",
  blush: "var(--ink-blush)",
};

/** Ink (text) CSS variable that stays legible on the matching {@link TONE_BG}. */
export const TONE_INK: Record<StickerTone, string> = {
  accent: "var(--accent-ink)",
  foreground: "var(--background)",
  mustard: "var(--foreground)",
  plum: "var(--accent-ink)",
  sky: "var(--accent-ink)",
  blush: "var(--foreground)",
};

/** All supported tones in render order — handy for pickers / fingerprints. */
export const STICKER_TONES: readonly StickerTone[] = [
  "accent",
  "foreground",
  "mustard",
  "plum",
  "sky",
  "blush",
] as const;
