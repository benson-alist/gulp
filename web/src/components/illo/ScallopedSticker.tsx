import type { ReactNode } from "react";
import { TONE_BG, TONE_INK, type StickerTone } from "./stickerTones";

/**
 * Scalloped / cookie-cutter circle sticker. Reads as a craft-fair badge
 * — softer and friendlier than {@link BurstSticker}.
 */

const SCALLOP_PATH: string = (() => {
  const N = 14;
  const R = 36;
  const cx = 50;
  const cy = 50;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= N; i += 1) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    points.push([cx + R * Math.cos(angle), cy + R * Math.sin(angle)]);
  }
  const chord = Math.hypot(
    points[1][0] - points[0][0],
    points[1][1] - points[0][1],
  );
  const scallopR = chord * 0.55;
  const fmt = (n: number) => n.toFixed(2);
  let d = `M ${fmt(points[0][0])} ${fmt(points[0][1])}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` A ${fmt(scallopR)} ${fmt(scallopR)} 0 0 1 ${fmt(points[i][0])} ${fmt(
      points[i][1],
    )}`;
  }
  return `${d} Z`;
})();

export default function ScallopedSticker({
  children,
  tone = "blush",
  rotate = -4,
  size = 84,
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  rotate?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-grid place-items-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(3px 3px 0 var(--foreground))",
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ overflow: "visible", display: "block" }}
      >
        <path
          d={SCALLOP_PATH}
          style={{ fill: TONE_BG[tone], stroke: "var(--foreground)" }}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center text-center px-4 leading-tight mono uppercase tracking-wider font-black text-[11px]"
        style={{ color: TONE_INK[tone] }}
      >
        {children}
      </span>
    </span>
  );
}
