"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "@/components/Confetti";
import CelebrationToast from "@/components/CelebrationToast";

const IDLE_MS = 30_000;

/**
 * Idle easter egg: after ``IDLE_MS`` without pointer activity, a mug emoji
 * scoots across the viewport; clicking it triggers confetti + a fake coupon
 * toast. Disabled when ``prefers-reduced-motion: reduce``.
 */
export default function RunawayMug() {
  const [armed, setArmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [caught, setCaught] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idleTimer = useRef<number | null>(null);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    idleTimer.current = window.setTimeout(() => setArmed(true), IDLE_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    const onAct = () => {
      if (!running) {
        setArmed(false);
        resetIdle();
      }
    };
    window.addEventListener("pointerdown", onAct, { passive: true });
    window.addEventListener("keydown", onAct);
    window.addEventListener("scroll", onAct, { passive: true });
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      window.removeEventListener("pointerdown", onAct);
      window.removeEventListener("keydown", onAct);
      window.removeEventListener("scroll", onAct);
    };
  }, [resetIdle, running]);

  useEffect(() => {
    if (!armed || running || caught) return;
    setRunning(true);
  }, [armed, running, caught]);

  useEffect(() => {
    if (!running || caught) return;
    const t = window.setTimeout(() => {
      setRunning(false);
      setArmed(false);
    }, 11_200);
    return () => window.clearTimeout(t);
  }, [running, caught]);

  const onCatch = useCallback(() => {
    setCaught(true);
    setRunning(false);
    setToast("You caught a stray! Code: SHELF10 (purely ceremonial).");
  }, []);

  if (caught) {
    return toast ? (
      <>
        <Confetti zClass="z-[55]" />
        <CelebrationToast message={toast} onDismiss={() => setToast(null)} />
      </>
    ) : null;
  }

  if (!running) return null;

  return (
    <button
      type="button"
      onClick={onCatch}
      className="runaway-mug-track fixed z-[50] bottom-[18%] text-5xl sm:text-6xl cursor-pointer hover:scale-110 transition-transform drop-shadow-[3px_4px_0_var(--foreground)]"
      aria-label="Catch the runaway mug"
    >
      ☕️
    </button>
  );
}
