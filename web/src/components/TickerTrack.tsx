"use client";

import { useState } from "react";

/**
 * Client marquee wrapper: pauses the infinite CSS ``ticker`` animation on
 * hover or pointer-down so users can read a line without chasing it.
 * Paired with the server ``Ticker`` which supplies the doubled string list.
 */
export default function TickerTrack({ items }: { items: string[] }) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      aria-hidden
      className="border-t border-[color:var(--border)] bg-[color:var(--foreground)] text-[color:var(--background)] overflow-hidden"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div
        className={`ticker-track flex gap-8 whitespace-nowrap py-1.5 mono text-[11px] uppercase tracking-wider ${
          paused ? "ticker-track--paused" : ""
        }`}
      >
        {items.map((text, i) => (
          <span key={i} className="flex items-center gap-2 shrink-0">
            <span>{text}</span>
            <span className="opacity-40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
