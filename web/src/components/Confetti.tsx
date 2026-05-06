"use client";

import type { CSSProperties } from "react";

/**
 * Full-viewport confetti layer using ``.confetti-root`` / ``.confetti-bit``
 * keyframes from ``globals.css``. Non-interactive; mount at a high z-index
 * when celebrating (claim, coin flip, successful list).
 *
 * @param zClass Tailwind z-index class for stacking (modal uses ``z-[5]`` under
 *               the dialog card; page-level celebrations may use ``z-[60]``).
 */
export default function Confetti({ zClass = "z-[5]" }: { zClass?: string }) {
  const bits = CONFETTI_PRESETS.map((preset, i) => (
    <span
      key={i}
      className={`confetti-bit ${preset.cls}`}
      style={
        {
          left: `${preset.leftPct}%`,
          animationDelay: `${preset.delayMs}ms`,
          "--confetti-dx": `${preset.dx}px`,
        } as CSSProperties
      }
    />
  ));
  return (
    <div
      className={`confetti-root fixed inset-0 pointer-events-none ${zClass}`}
      aria-hidden
    >
      {bits}
    </div>
  );
}

const CONFETTI_PRESETS: ReadonlyArray<{
  leftPct: number;
  delayMs: number;
  dx: number;
  cls: string;
}> = [
  { leftPct: 8, delayMs: 0, dx: -28, cls: "confetti-bit--a" },
  { leftPct: 15, delayMs: 40, dx: 12, cls: "confetti-bit--b" },
  { leftPct: 22, delayMs: 80, dx: -18, cls: "confetti-bit--c" },
  { leftPct: 30, delayMs: 20, dx: 34, cls: "confetti-bit--d" },
  { leftPct: 38, delayMs: 100, dx: -40, cls: "confetti-bit--e" },
  { leftPct: 45, delayMs: 60, dx: 8, cls: "confetti-bit--f" },
  { leftPct: 52, delayMs: 140, dx: -22, cls: "confetti-bit--a" },
  { leftPct: 58, delayMs: 30, dx: 44, cls: "confetti-bit--b" },
  { leftPct: 65, delayMs: 90, dx: -12, cls: "confetti-bit--c" },
  { leftPct: 72, delayMs: 70, dx: 20, cls: "confetti-bit--d" },
  { leftPct: 78, delayMs: 110, dx: -36, cls: "confetti-bit--e" },
  { leftPct: 85, delayMs: 50, dx: 16, cls: "confetti-bit--f" },
  { leftPct: 92, delayMs: 130, dx: -8, cls: "confetti-bit--a" },
  { leftPct: 12, delayMs: 160, dx: 52, cls: "confetti-bit--b" },
  { leftPct: 28, delayMs: 180, dx: -52, cls: "confetti-bit--c" },
  { leftPct: 48, delayMs: 200, dx: 6, cls: "confetti-bit--d" },
  { leftPct: 68, delayMs: 220, dx: -24, cls: "confetti-bit--e" },
  { leftPct: 88, delayMs: 240, dx: 40, cls: "confetti-bit--f" },
  { leftPct: 5, delayMs: 120, dx: 24, cls: "confetti-bit--a" },
  { leftPct: 95, delayMs: 150, dx: -48, cls: "confetti-bit--b" },
  { leftPct: 18, delayMs: 260, dx: 18, cls: "confetti-bit--c" },
  { leftPct: 35, delayMs: 280, dx: -30, cls: "confetti-bit--d" },
  { leftPct: 55, delayMs: 300, dx: 42, cls: "confetti-bit--e" },
  { leftPct: 75, delayMs: 320, dx: -14, cls: "confetti-bit--f" },
];
