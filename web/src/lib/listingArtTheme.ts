import type { MotifPalette } from "@/components/illo/MotifSticker";
import {
  STICKER_TONES,
  type StickerTone,
} from "@/components/illo/stickerTones";

/** CSS custom property name for each {@link StickerTone} background ink. */
const TONE_CSS_VAR: Record<StickerTone, string> = {
  accent: "--accent",
  foreground: "--foreground",
  mustard: "--ink-mustard",
  plum: "--ink-plum",
  sky: "--ink-sky",
  blush: "--ink-blush",
};

/**
 * Read a single ``:root`` custom property value (trimmed). Empty string when
 * called outside a browser.
 */
function readCssVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Snap the active theme's colours into concrete strings suitable for embedding
 * in SVG that will be serialized to PNG (no ``var(--…)`` indirection).
 */
export function snapshotListingArtTheme(): {
  palette: MotifPalette;
  toneHex: Record<StickerTone, string>;
} {
  const palette: MotifPalette = {
    stroke: readCssVar("--foreground"),
    cream: readCssVar("--accent-ink"),
    blush: readCssVar("--ink-blush"),
    sky: readCssVar("--ink-sky"),
  };
  const toneHex = {} as Record<StickerTone, string>;
  for (const t of STICKER_TONES) {
    toneHex[t] = readCssVar(TONE_CSS_VAR[t]);
  }
  return { palette, toneHex };
}
