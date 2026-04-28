"use client";

import type { ReactNode } from "react";
import { useScrollY } from "@/lib/useScroll";

/**
 * Sets ``--parallax-y`` on a wrapper so descendants with ``.parallax-stick`` drift slightly on scroll.
 */
export default function ParallaxVars({ children }: { children: ReactNode }) {
  const y = useScrollY();
  return (
    <div
      style={
        {
          "--parallax-y": `${y}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
