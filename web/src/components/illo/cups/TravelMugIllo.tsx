import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import type { CupIlloProps } from "./types";

/** Insulated travel mug: lid slab, body, and side grip arc. */
export function TravelMugIllo({
  defsIdPrefix,
  fill,
  stroke,
  accent,
}: CupIlloProps): ReactElement {
  const g = `${defsIdPrefix}-travel`;
  const strokeWidth = 4.5;
  const a = darkenHex(fill, 0.18);
  const b = brightenHex(mixHex(fill, accent, 0.3), 0.05);
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={a} />
          <stop offset="55%" stopColor={fill} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <rect
        x={54}
        y={44}
        width={92}
        height={30}
        rx={12}
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <rect
        x={50}
        y={72}
        width={100}
        height={128}
        rx={16}
        fill={`url(#${g})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <path
        d="M 150 96 H 178 Q 186 96 186 106 V 154 Q 186 164 178 164 H 150"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </g>
  );
}
