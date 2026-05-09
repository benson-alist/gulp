import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import type { CupIlloProps } from "./types";

/** Curved tumbler silhouette with gradient wrap. */
export function TumblerIllo({
  defsIdPrefix,
  fill,
  stroke,
  accent,
}: CupIlloProps): ReactElement {
  const g = `${defsIdPrefix}-tumb`;
  const strokeWidth = 4.5;
  const a = darkenHex(fill, 0.22);
  const b = brightenHex(mixHex(fill, accent, 0.35), 0.06);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={a} />
          <stop offset="45%" stopColor={fill} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <path
        d="M 56 78 Q 52 180 100 204 Q 148 180 144 78 Q 100 58 56 78 Z"
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
}
