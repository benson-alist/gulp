"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Bit = { id: number; x: number; y: number };

const MAX_BITS = 12;
const COLORS = [
  "var(--ink-mustard)",
  "var(--ink-sky)",
  "var(--ink-blush)",
  "var(--accent)",
];

/**
 * Wraps hero copy: pointer move on the wrapper spawns short-lived dots behind
 * the content (``z-0`` layer). Children stay clickable at ``z-10``.
 */
export default function HeroCursorTrail({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [bits, setBits] = useState<Bit[]>([]);
  const nextId = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      reduced.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced.current) return;
    if (e.pointerType === "touch") return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (Math.random() > 0.22) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;

    setBits((prev) => {
      const next = [...prev, { id, x, y }];
      if (next.length > MAX_BITS) next.splice(0, next.length - MAX_BITS);
      return next;
    });

    window.setTimeout(() => {
      setBits((prev) => prev.filter((b) => b.id !== id));
    }, 600);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onPointerMove={onMove}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        aria-hidden
      >
        {bits.map((b, i) => (
          <span
            key={b.id}
            className="hero-sparkle-bit absolute w-1.5 h-1.5 rounded-full opacity-90"
            style={{
              left: b.x,
              top: b.y,
              transform: "translate(-50%, -50%)",
              background: COLORS[i % COLORS.length],
            }}
          />
        ))}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
