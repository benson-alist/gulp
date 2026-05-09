import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import type { CupIlloProps } from "./types";

/** Stem glass: bowl uses accent-tinted glass fill. */
export function WineGlassIllo({
  defsIdPrefix,
  stroke,
  accent,
}: CupIlloProps): ReactElement {
  const g = `${defsIdPrefix}-wine`;
  const strokeWidth = 4.5;
  const bowl = mixHex(accent, "#ffffff", 0.35);
  const a = darkenHex(bowl, 0.1);
  const b = brightenHex(bowl, 0.15);
  const cx = 100;
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={a} />
          <stop offset="50%" stopColor={bowl} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - 44} 56 Q ${cx - 44} 118 ${cx} 134 Q ${cx + 44} 118 ${cx + 44} 56 Q ${cx + 44} 44 ${cx + 32} 40 H ${cx - 32} Q ${cx - 44} 44 ${cx - 44} 56`}
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={cx}
        y1={134}
        x2={cx}
        y2={208}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1={cx - 40}
        y1={210}
        x2={cx + 40}
        y2={210}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </g>
  );
}
