import type { ReactNode } from "react";

type StickerTone = "accent" | "foreground" | "mustard" | "plum" | "sky";

const toneCls: Record<StickerTone, string> = {
  accent: "bg-[color:var(--accent)] text-[color:var(--accent-ink)]",
  foreground: "bg-[color:var(--foreground)] text-[color:var(--background)]",
  mustard: "bg-[color:var(--ink-mustard)] text-[color:var(--foreground)]",
  plum: "bg-[color:var(--ink-plum)] text-[color:var(--accent-ink)]",
  sky: "bg-[color:var(--ink-sky)] text-[color:var(--accent-ink)]",
};

/**
 * Slightly rotated pill badge — reads like a price sticker on a shelf.
 */
export default function StickerBadge({
  children,
  tone = "accent",
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center mono text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full shadow-sticker border border-[color:var(--foreground)] -rotate-1 ${toneCls[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
