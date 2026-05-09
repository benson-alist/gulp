import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import type { CupIlloProps } from "./types";

export type GlassConeOptions = {
  wide: number;
  top: number;
  tall: number;
  /** Disambiguates gradient ids between cone variants. */
  gradKey: string;
};

/**
 * Tapered glass silhouette shared by shot, pint, and everyday glass types.
 */
export function GlassConeIllo(
  props: CupIlloProps & GlassConeOptions,
): ReactElement {
  const { defsIdPrefix, fill, stroke, accent, wide, top, tall, gradKey } = props;
  const g = `${defsIdPrefix}-${gradKey}`;
  const strokeWidth = 4.5;
  const cx = 100;
  const a = mixHex(fill, accent, 0.15);
  const glassFill = mixHex(a, "#ffffff", 0.55);
  const edge = mixHex(glassFill, stroke, 0.12);
  const y1 = top;
  const y2 = top + 150 * tall;
  const half = wide / 2;
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={darkenHex(edge, 0.15)} />
          <stop offset="40%" stopColor={glassFill} />
          <stop offset="100%" stopColor={brightenHex(edge, 0.2)} />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - half} ${y1} L ${cx - half + 8} ${y2} Q ${cx} ${y2 + 10} ${cx + half - 8} ${y2} L ${cx + half} ${y1} Q ${cx} ${y1 - 8} ${cx - half} ${y1}`}
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
}
