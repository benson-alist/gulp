import type { ReactNode } from "react";
import { useId } from "react";

/**
 * Perforated postage stamp — souvenir / “shipped from somewhere” vibe.
 *
 * Renders as a card-coloured rectangle with circle-punched perforations
 * around the perimeter and a thin inner border, plus a mono-caps headline
 * (and optional caption) centered inside.
 *
 * Best used on photos with a darker background so the perforations are
 * legible. Default rotation is mildly clockwise to differentiate from
 * other stickers like {@link RibbonBanner} which lean counter-clockwise.
 */
export default function PostageStamp({
  children,
  caption,
  rotate = 3,
  className = "",
}: {
  children: ReactNode;
  /** Tiny secondary line under the headline (e.g. a destination or year). */
  caption?: ReactNode;
  rotate?: number;
  className?: string;
}) {
  const maskId = useId();
  const w = 132;
  const h = 96;
  const r = 2.6;
  const stepX = 11;
  const stepY = 11;
  const horiz = Math.floor((w - 12) / stepX) + 1;
  const vert = Math.floor((h - 12) / stepY) + 1;

  return (
    <span
      className={`relative inline-block select-none ${className}`}
      style={{
        width: w,
        height: h,
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(3px 3px 0 var(--foreground))",
      }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        style={{ display: "block" }}
      >
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={w}
          height={h}
        >
          <rect x="0" y="0" width={w} height={h} fill="white" />
          {Array.from({ length: horiz }).map((_, i) => {
            const cx = 6 + i * stepX;
            return (
              <g key={`h-${i}`}>
                <circle cx={cx} cy={0} r={r} fill="black" />
                <circle cx={cx} cy={h} r={r} fill="black" />
              </g>
            );
          })}
          {Array.from({ length: vert }).map((_, i) => {
            const cy = 6 + i * stepY;
            return (
              <g key={`v-${i}`}>
                <circle cx={0} cy={cy} r={r} fill="black" />
                <circle cx={w} cy={cy} r={r} fill="black" />
              </g>
            );
          })}
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect
            x="0"
            y="0"
            width={w}
            height={h}
            style={{ fill: "var(--card)", stroke: "var(--foreground)" }}
            strokeWidth="3"
          />
          <rect
            x="8"
            y="8"
            width={w - 16}
            height={h - 16}
            fill="none"
            style={{ stroke: "var(--foreground)" }}
            strokeWidth="1"
            opacity="0.45"
          />
        </g>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        <span
          className="mono uppercase tracking-widest font-black text-[11px]"
          style={{ color: "var(--foreground)" }}
        >
          {children}
        </span>
        {caption ? (
          <span
            className="mono uppercase tracking-wider text-[9px] mt-0.5"
            style={{ color: "var(--muted)" }}
          >
            {caption}
          </span>
        ) : null}
      </span>
    </span>
  );
}
