"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useScrollY } from "@/lib/useScroll";
import {
  MASCOT_VIGNETTE_STYLE,
  MascotIntegratedFrame,
} from "@/components/IntegratedMascot";

type MascotPeekProps = {
  /** Public path under ``/public`` (e.g. ``/hero.png``). */
  src: string;
  alt: string;
  /** Edge the mascot peeks from. */
  edge?: "bottom" | "right";
  className?: string;
  width?: number;
  height?: number;
  /** Nudge head tilt from scroll velocity (footer mascot). */
  reactToScroll?: boolean;
  /**
   * When true, renders inside ``MascotIntegratedFrame`` with vignette and cover crop
   * so the asset matches hero/auth mascot styling.
   */
  integrated?: boolean;
  /**
   * Responsive 80px / 96px tile for the global footer; ignores ``width`` / ``height``.
   * Use with ``integrated``.
   */
  footerCompact?: boolean;
};

/**
 * Image that slides slightly into view when intersecting the viewport —
 * mascot “peeking” from an edge for empty states / footer moments.
 *
 * With ``integrated``, uses the same grain/halftone frame and radial mask as
 * ``IntegratedMascot`` for visual continuity across the site.
 */
export default function MascotPeek({
  src,
  alt,
  edge = "bottom",
  className = "",
  width = 120,
  height = 120,
  reactToScroll = false,
  integrated = false,
  footerCompact = false,
}: MascotPeekProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const scrollY = useScrollY();
  const prevY = useRef(scrollY);
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    if (!reactToScroll) return;
    const dy = scrollY - prevY.current;
    prevY.current = scrollY;
    const next = Math.max(-10, Math.min(10, dy * 0.12));
    setTilt(next);
    const t = window.setTimeout(() => setTilt(0), 180);
    return () => window.clearTimeout(t);
  }, [scrollY, reactToScroll]);

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

  const dimensionStyle = footerCompact ? undefined : { width, height };
  const dimensionClass = footerCompact ? "h-20 w-20 sm:h-24 sm:w-24" : "";

  const innerMotion = (
    <div
      className={`absolute inset-0 flex items-end justify-center ${integrated ? "overflow-hidden rounded-2xl" : ""}`}
      style={{
        transform: `${translate} rotate(${tilt}deg)`,
        transition: "transform 600ms cubic-bezier(0.34, 1.4, 0.64, 1)",
      }}
    >
      <div className="bob relative h-full w-full min-h-0">
        {integrated ? (
          <div
            className="relative h-full min-h-0 w-full"
            style={MASCOT_VIGNETTE_STYLE}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="object-cover object-[52%_36%] scale-[1.14] select-none"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-end justify-center">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (integrated) {
    return (
      <MascotIntegratedFrame
        ref={ref}
        className={`${dimensionClass} ${className}`.trim()}
        style={dimensionStyle}
        aria-hidden={!alt}
      >
        {innerMotion}
      </MascotIntegratedFrame>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
      aria-hidden={!alt}
    >
      {innerMotion}
    </div>
  );
}
