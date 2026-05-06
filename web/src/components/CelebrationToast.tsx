"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed snackbar for a short celebration line. Dismisses automatically and
 * calls ``onDismiss`` when the timer fires. ``onDismiss`` is read from a ref
 * so parent inline lambdas do not reset the timeout on every render.
 */
export default function CelebrationToast({
  message,
  onDismiss,
  durationMs = 4200,
}: {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const t = window.setTimeout(() => dismissRef.current(), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, message]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-[min(92vw,24rem)] px-4 py-3 rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] shadow-sticker text-sm font-semibold text-center"
    >
      {message}
    </div>
  );
}
