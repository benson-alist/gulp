import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import type { CupIlloProps } from "./types";

/** Playful rounded vessel with simple “face” accents. */
export function NoveltyIllo({
  defsIdPrefix,
  fill,
  stroke,
  accent,
}: CupIlloProps): ReactElement {
  const g = `${defsIdPrefix}-novel`;
  const strokeWidth = 4.5;
  const a = mixHex(fill, accent, 0.2);
  const b = brightenHex(a, 0.12);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={darkenHex(a, 0.2)} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <path
        d="M 54 80 Q 44 150 100 200 Q 156 150 146 80 Q 100 52 54 80 Z"
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx={78} cy={120} r={8} fill={stroke} opacity={0.85} />
      <circle cx={122} cy={120} r={8} fill={stroke} opacity={0.85} />
      <path
        d="M 82 158 Q 100 176 118 158"
        fill="none"
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </g>
  );
}
