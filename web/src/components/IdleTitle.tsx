"use client";

import { useEffect, useRef } from "react";

const BASE_TITLE = "Gulp — The marketplace for one too many";

const IDLE_TITLES = [
  "Your cupboard misses you.",
  "14 mugs. 2 hands. You do the math.",
  "Come back — a tumbler needs a home.",
  "The tab is lonely. The cups are waiting.",
  "Hydration can wait. Rehoming cannot.",
];

/**
 * When the document is hidden, rotate cheeky ``document.title`` lines so
 * returning to the tab feels like the site noticed you left.
 */
export default function IdleTitle() {
  const baseRef = useRef(BASE_TITLE);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    baseRef.current = document.title || BASE_TITLE;

    function clearRotator() {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function startRotator() {
      clearRotator();
      timerRef.current = window.setInterval(() => {
        idxRef.current = (idxRef.current + 1) % IDLE_TITLES.length;
        document.title = IDLE_TITLES[idxRef.current] ?? BASE_TITLE;
      }, 2800);
    }

    function onVis() {
      if (document.visibilityState === "hidden") {
        startRotator();
        idxRef.current = 0;
        document.title = IDLE_TITLES[0] ?? BASE_TITLE;
      } else {
        clearRotator();
        document.title = baseRef.current;
      }
    }

    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearRotator();
      document.title = baseRef.current;
    };
  }, []);

  return null;
}
