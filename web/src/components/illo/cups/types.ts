/**
 * Props for inline drinkware illustration paths (auto listing art SVG).
 * Colours are always explicit hex — no CSS variables — for raster export.
 */
export type CupIlloProps = {
  /**
   * Prefix for gradient / clip ``id``s so multiple previews on one page or
   * repeated exports never collide.
   */
  defsIdPrefix: string;
  /** Ceramic, metal, or opaque tumbler body colour. */
  fill: string;
  /** Outline ink and specular edge definition. */
  stroke: string;
  /** Highlights, steam, and accent plastics (lids, handles). */
  accent: string;
};
