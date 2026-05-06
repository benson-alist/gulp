"use client";

import { useEffect, useRef, useState } from "react";

const PATH =
  "M2 12 Q 40 4 80 12 T 160 10 T 240 14";

type ScribbleUnderlineProps = {
  /** Stroke color; defaults to accent. */
  className?: string;
};

/**
 * Wavy scribble underline that draws in when scrolled into view (IntersectionObserver).
 */
export default function ScribbleUnderline({
  className = "text-[color:var(--accent)]",
}: ScribbleUnderlineProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const path = el.querySelector("path");
    if (!path || !(path instanceof SVGPathElement)) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setReady(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className={`block w-full max-w-full h-4 ${className} ${ready ? "scribble-draw" : ""}`}
      viewBox="0 0 244 20"
      preserveAspectRatio="xMinYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d={PATH}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
