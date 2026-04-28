"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type MascotPeekProps = {
  /** Public path under ``/public`` (e.g. ``/hero.png``). */
  src: string;
  alt: string;
  /** Edge the mascot peeks from. */
  edge?: "bottom" | "right";
  className?: string;
  width?: number;
  height?: number;
};

/**
 * Image that slides slightly into view when intersecting the viewport —
 * mascot “peeking” from an edge for empty states / footer moments.
 */
export default function MascotPeek({
  src,
  alt,
  edge = "bottom",
  className = "",
  width = 120,
  height = 120,
}: MascotPeekProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const translate =
    edge === "bottom"
      ? visible
        ? "translateY(0)"
        : "translateY(40%)"
      : visible
        ? "translateX(0)"
        : "translateX(40%)";

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height,
      }}
      aria-hidden={!alt}
    >
      <div
        className="bob absolute inset-0 flex items-end justify-center"
        style={{
          transform: translate,
          transition: "transform 600ms cubic-bezier(0.34, 1.4, 0.64, 1)",
        }}
      >
        <Image src={src} alt={alt} width={width} height={height} className="object-contain" />
      </div>
    </div>
  );
}
