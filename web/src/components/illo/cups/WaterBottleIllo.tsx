import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import type { CupIlloProps } from "./types";

/** Narrow bottle with cap block and tapered body. */
export function WaterBottleIllo({
  defsIdPrefix,
  fill,
  stroke,
  accent,
}: CupIlloProps): ReactElement {
  const g = `${defsIdPrefix}-bottle`;
  const strokeWidth = 4.5;
  const a = darkenHex(fill, 0.2);
  const b = brightenHex(mixHex(fill, accent, 0.25), 0.06);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={a} />
          <stop offset="50%" stopColor={fill} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <rect
        x={62}
        y={48}
        width={76}
        height={24}
        rx={10}
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <path
        d="M 58 76 V 186 Q 58 202 74 206 H 126 Q 142 202 142 186 V 76 Z"
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
}
