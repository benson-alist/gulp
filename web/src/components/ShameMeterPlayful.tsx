"use client";

import { useCallback, useRef, useState } from "react";
import ShameMeter from "@/components/ShameMeter";

type Props = {
  value: number;
};

/**
 * Wraps ``ShameMeter`` with a draggable “?/10” sticker that wobbles and springs back.
 *
 * Purely decorative; pointer feedback does not change the underlying honesty index.
 */
export default function ShameMeterPlayful({ value }: Props) {
  const clamped = Math.max(1, Math.min(10, Math.round(value)));
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(false);
  const origin = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = true;
      setIsDragging(true);
      origin.current = {
        px: e.clientX,
        py: e.clientY,
        x: pos.x,
        y: pos.y,
      };
    },
    [pos.x, pos.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - origin.current.px + origin.current.x;
    const dy = e.clientY - origin.current.py + origin.current.y;
    const max = 36;
    setPos({
      x: Math.max(-max, Math.min(max, dx)),
      y: Math.max(-max, Math.min(max, dy)),
    });
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setPos({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative">
      <ShameMeter value={value} />
      <div
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute -right-1 top-0 cursor-grab active:cursor-grabbing select-none touch-none"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.x * 0.08}deg)`,
          transition: isDragging
            ? "none"
            : "transform 420ms cubic-bezier(0.34, 1.4, 0.64, 1)",
        }}
      >
        <span className="inline-flex mono text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-[color:var(--foreground)] bg-[color:var(--ink-mustard)] text-[color:var(--foreground)] shadow-sticker">
          {clamped}?/10
        </span>
      </div>
    </div>
  );
}
