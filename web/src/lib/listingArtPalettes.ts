import { rngFrom } from "@/lib/listingArtPlacements";

/**
 * Warm/cool bias for halftone dots and shadow weight on the scrapbook scene.
 */
export type ListingArtMood = "light" | "dark";

/**
 * One curated background + cup + accent triple for auto-generated listing art.
 * Colours are opaque hex so PNG raster export matches the live SVG preview.
 */
export type CuratedPalette = {
  /** Stable label for debugging / future analytics. */
  id: string;
  /** Gradient start (top-left bias in the linear gradient). */
  bgA: string;
  /** Gradient end. */
  bgB: string;
  /** Primary ceramic / tumbler body colour passed to drinkware SVG. */
  cup: string;
  /** Rim highlight, steam, travel-mug accents — distinct from cup body fill. */
  accent: string;
  /** Halftone + shadow treatment. */
  mood: ListingArtMood;
};

/**
 * Ten hand-tuned pairs: soft scrapbook pastels that stay readable behind motifs.
 */
export const CURATED_PALETTES: readonly CuratedPalette[] = [
  {
    id: "dust_rose",
    bgA: "#f7ece8",
    bgB: "#e8bcc4",
    cup: "#f3e6e0",
    accent: "#c86b6b",
    mood: "light",
  },
  {
    id: "sea_mist",
    bgA: "#e8f4f2",
    bgB: "#b9dcd4",
    cup: "#e2f0ee",
    accent: "#3d8a7d",
    mood: "light",
  },
  {
    id: "butter_paper",
    bgA: "#fdf6e3",
    bgB: "#f0d9a8",
    cup: "#faf0d7",
    accent: "#c9a227",
    mood: "light",
  },
  {
    id: "lavender_ash",
    bgA: "#f0ecf7",
    bgB: "#cdc0e4",
    cup: "#ebe4f5",
    accent: "#6b5a9e",
    mood: "light",
  },
  {
    id: "sage_postcard",
    bgA: "#ecf2ea",
    bgB: "#bfcfbb",
    cup: "#e5ebe2",
    accent: "#4f6b4a",
    mood: "light",
  },
  {
    id: "ink_parchment",
    bgA: "#f2eee6",
    bgB: "#c9bfb0",
    cup: "#ded5c8",
    accent: "#3b342c",
    mood: "dark",
  },
  {
    id: "deep_teal_card",
    bgA: "#dfe9e8",
    bgB: "#89b0af",
    cup: "#d5e3e2",
    accent: "#1f4a47",
    mood: "dark",
  },
  {
    id: "currant_fold",
    bgA: "#f1e8ec",
    bgB: "#c9a0ae",
    cup: "#eadde3",
    accent: "#6b2d3f",
    mood: "dark",
  },
  {
    id: "terracotta_tile",
    bgA: "#f6ebe3",
    bgB: "#deb5a0",
    cup: "#eed9cc",
    accent: "#8c4a32",
    mood: "dark",
  },
  {
    id: "storm_denim",
    bgA: "#e6ebf2",
    bgB: "#9faebf",
    cup: "#dde4ed",
    accent: "#2c3d52",
    mood: "dark",
  },
] as const;

/**
 * Deterministic palette for a listing seed.
 * Uses a salted seed so the first PRNG draw is independent of sticker layout's stream.
 */
export function pickCuratedPalette(seed: number): CuratedPalette {
  const rng = rngFrom(seed ^ 0x6d2b79f5);
  const idx = Math.floor(rng() * CURATED_PALETTES.length);
  return CURATED_PALETTES[idx] ?? CURATED_PALETTES[0]!;
}
