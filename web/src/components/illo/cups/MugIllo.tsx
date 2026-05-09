import type { ReactElement } from "react";
import { brightenHex, darkenHex, mixHex } from "@/lib/cupColorUtils";
import { CUP_LIQUID_HEX } from "./constants";
import type { CupIlloProps } from "./types";

/**
 * Classic belly mug: gradient shell, lip, coffee surface, C-handle, steam.
 */
export function MugIllo({
  defsIdPrefix,
  fill,
  stroke,
  accent,
}: CupIlloProps): ReactElement {
  const strokeWidth = 4.5;
  const bodyGrad = `${defsIdPrefix}-mug-body`;
  const rimGrad = `${defsIdPrefix}-mug-rim`;
  const shade = darkenHex(fill, 0.26);
  const light = brightenHex(mixHex(fill, accent, 0.38), 0.08);
  const liquid = mixHex(CUP_LIQUID_HEX, stroke, 0.35);
  const lip = brightenHex(fill, 0.14);

  return (
    <g>
      <defs>
        <linearGradient id={bodyGrad} x1="0%" y1="0%" x2="100%" y2="95%">
          <stop offset="0%" stopColor={shade} />
          <stop offset="42%" stopColor={fill} />
          <stop offset="100%" stopColor={light} />
        </linearGradient>
        <linearGradient id={rimGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={brightenHex(lip, 0.12)} />
          <stop offset="100%" stopColor={lip} />
        </linearGradient>
      </defs>

      <path
        d="M 139 102 C 168 96, 181 118, 181 144 C 181 172, 168 194 139 188"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="
          M 62 94
          C 62 84 72 78 100 76
          C 128 78 138 84 138 94
          L 138 176
          C 138 198 128 206 100 208
          C 72 206 62 198 62 176
          Z
        "
        fill={`url(#${bodyGrad})`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      <ellipse
        cx={100}
        cy={86}
        rx={38}
        ry={10}
        fill={`url(#${rimGrad})`}
        stroke={stroke}
        strokeWidth={strokeWidth * 0.75}
      />

      <ellipse
        cx={100}
        cy={88}
        rx={28}
        ry={6}
        fill={liquid}
        opacity={0.92}
      />

      <path
        d="M 72 98 Q 76 140 74 184"
        fill="none"
        stroke={brightenHex(accent, 0.35)}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.35}
      />

      <g opacity={0.5} stroke={accent} fill="none" strokeLinecap="round">
        <path d="M 88 62 Q 82 48 88 34" strokeWidth={2.5} />
        <path d="M 100 58 Q 100 42 98 28" strokeWidth={2.5} />
        <path d="M 112 62 Q 118 48 112 36" strokeWidth={2.5} />
      </g>
    </g>
  );
}
