import type { ReactNode } from "react";
import type { DrinkwareType } from "@/lib/api";

type Props = {
  /** Primary ceramic / glass fill. */
  fill: string;
  /** Outline ink (matches motif stroke). */
  stroke: string;
  /** Which archetype to draw. */
  drinkware: DrinkwareType;
};

const vbW = 200;
const vbH = 240;

/**
 * Bold vector silhouette for auto-generated listing covers — no emoji fonts,
 * so raster export looks identical across browsers.
 */
export default function DrinkwareSilhouette({ fill, stroke, drinkware }: Props) {
  const s = {
    fill,
    stroke,
    strokeWidth: 5,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <g aria-hidden filter={`drop-shadow(4px 5px 0 ${stroke})`}>
      <ellipse
        cx={vbW / 2}
        cy={vbH - 28}
        rx={68}
        ry={14}
        fill={stroke}
        opacity={0.12}
      />
      {renderSilhouetteBody(drinkware, s)}
    </g>
  );
}

type SilhouetteStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinejoin: "round";
  strokeLinecap: "round";
};

/**
 * SVG paths for each drinkware archetype at a consistent center within
 * ``0 … vbW`` × ``0 … vbH``.
 */
function renderSilhouetteBody(
  type: DrinkwareType,
  style: SilhouetteStyle,
): ReactNode {
  const cx = vbW / 2;

  switch (type) {
    case "mug":
      return (
        <>
          <path
            d={`M ${cx - 52} 70 Q ${cx - 52} 55 ${cx - 40} 50 H ${cx + 40} Q ${cx + 52} 55 ${cx + 52} 70 V 175 Q ${cx + 52} 192 ${cx + 40} 196 H ${cx - 40} Q ${cx - 52} 192 ${cx - 52} 175 Z`}
            {...style}
          />
          <path
            d={`M ${cx + 52} 95 H ${cx + 78} Q ${cx + 90} 95 ${cx + 90} 108 V 152 Q ${cx + 90} 165 ${cx + 78} 165 H ${cx + 52}`}
            fill="none"
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${cx - 20} 50 Q ${cx} 38 ${cx + 20} 50`}
            fill="none"
            stroke={style.stroke}
            strokeWidth={4}
          />
        </>
      );
    case "water_bottle":
      return (
        <>
          <rect
            x={cx - 38}
            y={52}
            width={76}
            height={22}
            rx={8}
            {...style}
          />
          <path
            d={`M ${cx - 42} 74 V 178 Q ${cx - 42} 195 ${cx - 28} 200 H ${cx + 28} Q ${cx + 42} 195 ${cx + 42} 178 V 74 Z`}
            {...style}
          />
        </>
      );
    case "shot_glass":
      return (
        <path
          d={`M ${cx - 44} 78 L ${cx - 34} 188 Q ${cx - 34} 200 ${cx - 22} 204 H ${cx + 22} Q ${cx + 34} 200 ${cx + 34} 188 L ${cx + 44} 78 Q ${cx + 44} 66 ${cx + 36} 60 H ${cx - 36} Q ${cx - 44} 66 ${cx - 44} 78 Z`}
          {...style}
        />
      );
    case "wine_glass":
      return (
        <>
          <path
            d={`M ${cx - 46} 55 Q ${cx - 46} 120 ${cx} 138 Q ${cx + 46} 120 ${cx + 46} 55 Q ${cx + 46} 42 ${cx + 34} 38 H ${cx - 34} Q ${cx - 46} 42 ${cx - 46} 55 Z`}
            {...style}
          />
          <line
            x1={cx}
            y1={138}
            x2={cx}
            y2={210}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeLinecap="round"
          />
          <line
            x1={cx - 42}
            y1={212}
            x2={cx + 42}
            y2={212}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeLinecap="round"
          />
        </>
      );
    case "pint_glass":
      return (
        <path
          d={`M ${cx - 50} 58 L ${cx - 38} 192 Q ${cx - 38} 204 ${cx - 26} 208 H ${cx + 26} Q ${cx + 38} 204 ${cx + 38} 192 L ${cx + 50} 58 Q ${cx + 50} 50 ${cx + 42} 46 H ${cx - 42} Q ${cx - 50} 50 ${cx - 50} 58 Z`}
          {...style}
        />
      );
    case "glass":
      return (
        <path
          d={`M ${cx - 48} 56 L ${cx - 40} 198 Q ${cx - 40} 208 ${cx - 30} 212 H ${cx + 30} Q ${cx + 40} 208 ${cx + 40} 198 L ${cx + 48} 56 Q ${cx + 48} 48 ${cx + 40} 44 H ${cx - 40} Q ${cx - 48} 48 ${cx - 48} 56 Z`}
          {...style}
        />
      );
    case "travel_mug":
      return (
        <>
          <rect
            x={cx - 54}
            y={62}
            width={108}
            height={138}
            rx={18}
            {...style}
          />
          <path
            d={`M ${cx + 54} 88 H ${cx + 86} Q ${cx + 96} 88 ${cx + 96} 100 V 150 Q ${cx + 96} 162 ${cx + 86} 162 H ${cx + 54}`}
            fill="none"
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeLinecap="round"
          />
          <rect
            x={cx - 40}
            y={48}
            width={80}
            height={28}
            rx={12}
            {...style}
          />
        </>
      );
    case "tumbler":
      return (
        <path
          d={`M ${cx - 52} 64 Q ${cx - 56} 180 ${cx} 202 Q ${cx + 56} 180 ${cx + 52} 64 Q ${cx + 48} 52 ${cx + 36} 48 H ${cx - 36} Q ${cx - 48} 52 ${cx - 52} 64 Z`}
          {...style}
        />
      );
    case "novelty":
    default:
      return (
        <>
          <path
            d={`M ${cx - 50} 72 C ${cx - 70} 140, ${cx + 70} 140, ${cx + 50} 72 Q ${cx + 56} 50 ${cx + 40} 46 H ${cx - 40} Q ${cx - 56} 50 ${cx - 50} 72 Z`}
            {...style}
          />
          <circle cx={cx - 22} cy={110} r={8} fill={style.stroke} stroke="none" />
          <circle cx={cx + 22} cy={110} r={8} fill={style.stroke} stroke="none" />
          <path
            d={`M ${cx - 18} 150 Q ${cx} 168 ${cx + 18} 150`}
            fill="none"
            stroke={style.stroke}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </>
      );
  }
}

export { vbW as DRINKWARE_ART_VB_W, vbH as DRINKWARE_ART_VB_H };
