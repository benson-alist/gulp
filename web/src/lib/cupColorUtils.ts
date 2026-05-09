/**
 * Tiny hex colour helpers for recolorable cup templates (auto listing art).
 * Works with ``#rgb`` / ``#rrggbb`` as produced by ``getComputedStyle``.
 */

/**
 * Parse ``#abc`` or ``#aabbcc`` into RGB channels. Returns null if invalid.
 */
export function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s)) return null;
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/**
 * Blend two hex colours; ``t=0`` is ``a``, ``t=1`` is ``b``.
 * Falls back to ``a`` when parsing fails.
 */
export function mixHex(a: string, b: string, t: number): string {
  const A = parseHexRgb(a);
  const B = parseHexRgb(b);
  if (!A || !B) return a;
  const r = lerp(A.r, B.r, t);
  const g = lerp(A.g, B.g, t);
  const bl = lerp(A.b, B.b, t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/** Nudge toward white for a ceramic highlight. */
export function brightenHex(hex: string, t: number): string {
  return mixHex(hex, "#ffffff", Math.max(0, Math.min(1, t)));
}

/** Nudge toward black for depth. */
export function darkenHex(hex: string, t: number): string {
  return mixHex(hex, "#000000", Math.max(0, Math.min(1, t)));
}
