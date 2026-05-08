/**
 * Stable 32-bit fingerprint from human-edited fields — used for layout RNG.
 */
export function hashListingArtSeed(parts: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < parts.length; i++) {
    h ^= parts.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
