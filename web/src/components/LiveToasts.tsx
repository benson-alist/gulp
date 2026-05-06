"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";

type Toast = { id: number; text: string; demo?: boolean };

const DEMO_LINES = [
  "🫠 Someone in Cupboard City just admitted they own 14 mugs.",
  "🧴 A Stanley just changed postcodes without moving.",
  "♻️ Shelf space: liberated. Dignity: still TBD.",
  "🛒 A browse tab refresh counts as self-care.",
];

/**
 * Subscribes to ``GET {API_BASE}/events`` (SSE) and stacks short activity
 * toasts. Falls back to rotating **demo** lines if the stream is quiet for
 * 70s so local dev never feels dead.
 */
export default function LiveToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const lastReal = useRef(typeof Date !== "undefined" ? Date.now() : 0);
  const demoTimer = useRef<number | null>(null);

  const pushToast = useCallback((text: string, demo = false) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-4), { id, text, demo }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 6500);
  }, []);

  useEffect(() => {
    const url = `${API_BASE}/events`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
    } catch {
      return;
    }

    const onMessage = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as { text?: string };
        if (data.text) {
          lastReal.current = Date.now();
          pushToast(data.text, false);
        }
      } catch {
        /* ignore */
      }
    };
    es.addEventListener("message", onMessage as EventListener);
    es.onerror = () => {
      /* browser will retry */
    };

    demoTimer.current = window.setInterval(() => {
      if (Date.now() - lastReal.current < 70_000) return;
      const line = DEMO_LINES[Math.floor(Math.random() * DEMO_LINES.length)];
      if (line) pushToast(`${line} · demo`, true);
    }, 22_000);

    return () => {
      es?.close();
      if (demoTimer.current) window.clearInterval(demoTimer.current);
    };
  }, [pushToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-3 right-3 bottom-20 z-[45] flex flex-col gap-2 max-w-[min(92vw,18rem)] mx-auto md:left-auto md:right-4 md:bottom-6 md:mx-0 md:ml-auto pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl border-2 px-3 py-2 text-xs font-semibold shadow-sticker ${
            t.demo
              ? "border-[color:var(--border)] bg-[color:var(--card)]/95 text-[color:var(--muted)]"
              : "border-[color:var(--foreground)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
