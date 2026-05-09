import type { DrinkwareType } from "@/lib/api";
import { CUP_ILLOS } from "./cups";

export type DrinkwareSilhouetteProps = {
  /** Primary body colour (ceramic / glass). */
  fill: string;
  /** Outline and SVG feDropShadow ink. */
  stroke: string;
  /** Highlight / steam tint — from curated listing palette or motif cream. */
  accent: string;
  drinkware: DrinkwareType;
  /**
   * Unique prefix for SVG ``id``s (gradients, filters) so multiple scenes /
   * exports never collide.
   */
  defsIdPrefix: string;
};

const vbW = 200;
const vbH = 240;

/**
 * Illustration-style drinkware for auto covers. Dispatches to modular cup
 * SVGs; colours are 100% props-driven (no CSS variables) so PNG raster export
 * matches the live preview.
 */
export default function DrinkwareSilhouette({
  fill,
  stroke,
  accent,
  drinkware,
  defsIdPrefix,
}: DrinkwareSilhouetteProps) {
  const Cup = CUP_ILLOS[drinkware];
  const feId = `${defsIdPrefix}-cup-fe`;

  return (
    <g aria-hidden>
      <defs>
        <filter
          id={feId}
          x="-55%"
          y="-55%"
          width="210%"
          height="210%"
        >
          <feDropShadow
            dx="2"
            dy="4"
            stdDeviation="2.8"
            floodColor={stroke}
            floodOpacity="0.24"
          />
        </filter>
      </defs>
      <g filter={`url(#${feId})`}>
        <ellipse
          cx={vbW / 2}
          cy={vbH - 28}
          rx={68}
          ry={14}
          fill={stroke}
          opacity={0.1}
        />
        <Cup
          defsIdPrefix={defsIdPrefix}
          fill={fill}
          stroke={stroke}
          accent={accent}
        />
      </g>
    </g>
  );
}

export { vbW as DRINKWARE_ART_VB_W, vbH as DRINKWARE_ART_VB_H };
