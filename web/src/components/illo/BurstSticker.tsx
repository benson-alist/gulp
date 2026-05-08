import type { ReactNode } from "react";
import { TONE_BG, TONE_INK, type StickerTone } from "./stickerTones";

/**
 * Spiky sunburst sticker — high-energy attention grabber. Reads as
 * a “DEAL!” / “FRESH!” starburst slapped on a flyer.
 *
 * Pair with very short labels (≤2 short words). The shape extends past the
 * background fill via ``overflow: visible`` on the SVG, so the parent should
 * either reserve space for the spikes or accept that the sticker pokes out
 * of its box (which is usually the desired vibe).
 */
export default function BurstSticker({
  children,
  tone = "mustard",
  rotate = -6,
  size = 84,
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  /** Degrees of rotation applied to the whole sticker. */
  rotate?: number;
  /** Outer width / height in pixels. */
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
        <polygon
          points="50,2 56,22 74,8 70,30 92,18 80,38 98,46 78,52 96,72 74,68 80,90 60,76 50,98 40,76 20,90 26,68 4,72 22,52 2,46 20,38 8,18 30,30 26,8 44,22"
          style={{ fill: TONE_BG[tone], stroke: "var(--foreground)" }}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center text-center px-3 leading-tight mono uppercase tracking-wider font-black text-[11px]"
        style={{ color: TONE_INK[tone] }}
      >
        {children}
      </span>
    </span>
  );
}
