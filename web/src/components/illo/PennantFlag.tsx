import type { ReactNode } from "react";
import { TONE_BG, TONE_INK, type StickerTone } from "./stickerTones";

/**
 * Swallowtail pennant flag — a rectangle with a triangular notch cut out
 * of its right edge. Reads as a garage-sale streamer or sports pennant.
 *
 * Counterpart to {@link RibbonBanner}, which points outward instead of
 * cutting inward — pair them by alternating across cards for variety.
 */
export default function PennantFlag({
  children,
  tone = "accent",
  rotate = -8,
  width = 120,
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  rotate?: number;
  /** Outer width in pixels (height is fixed at 36). */
  width?: number;
  className?: string;
}) {
  const h = 36;
  const notch = 18;
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
          d={`M2,2 L${width - 2},2 L${width - notch},${h / 2} L${width - 2},${
            h - 2
          } L2,${h - 2} Z`}
          style={{ fill: TONE_BG[tone], stroke: "var(--foreground)" }}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center pl-3 mono uppercase tracking-wider font-black text-[10px]"
        style={{
          color: TONE_INK[tone],
          paddingRight: notch + 6,
        }}
      >
        {children}
      </span>
    </span>
  );
}
