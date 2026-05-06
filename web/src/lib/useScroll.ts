"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current vertical scroll position (``window.scrollY``), updating
 * on scroll. Used to drive ``--parallax-y`` on elements with ``.parallax-stick``.
 */
export function useScrollY(): number {
  const [y, setY] = useState(0);

  useEffect(() => {
    function onScroll() {
      setY(window.scrollY);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return y;
}
