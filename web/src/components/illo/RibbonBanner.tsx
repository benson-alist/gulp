import type { ReactNode } from "react";
import { TONE_BG, TONE_INK, type StickerTone } from "./stickerTones";

/**
 * Ribbon / pennant tag with a pointed right end — reads as a museum
 * label or “EXHIBIT A” tag pinned to the cup.
 *
 * The shape (border + fill) is drawn in SVG so the right-edge notch keeps
 * its outline. Width is fixed via the ``width`` prop so the SVG path can
 * scale without distorting the stroke; pick a width comfortable for the
 * label you’re passing in (default fits ~12 mono-uppercase characters).
 */
export default function RibbonBanner({
  children,
  tone = "plum",
  rotate = -3,
  width = 132,
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  rotate?: number;
  /** Outer width in pixels (height is fixed at 32). */
  width?: number;
  className?: string;
}) {
  const h = 32;
  const notch = 14;
  return (
    <span
      className={`relative inline-block select-none ${className}`}
      style={{
        width,
        height: h,
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(3px 3px 0 var(--foreground))",
      }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${width} ${h}`}
        width={width}
        height={h}
        style={{ display: "block", overflow: "visible" }}
      >
        <path
          d={`M2,2 L${width - notch},2 L${width - 2},${h / 2} L${
            width - notch
          },${h - 2} L2,${h - 2} Z`}
          style={{ fill: TONE_BG[tone], stroke: "var(--foreground)" }}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center pl-3 mono uppercase tracking-wider font-black text-[10px]"
        style={{
          color: TONE_INK[tone],
          paddingRight: notch + 4,
        }}
      >
        {children}
      </span>
    </span>
  );
}
