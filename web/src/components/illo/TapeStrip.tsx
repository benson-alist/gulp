import type { ReactNode } from "react";

/**
 * Translucent “masking tape” strip for prices or labels.
 *
 * When ``peelable`` is true, hover/focus lifts the strip slightly — listing
 * hero prices only; avoid stacking with ``sticker-peel`` on parent cards.
 */
export default function TapeStrip({
  children,
  className = "",
  rotate = -2,
  peelable = false,
}: {
  children: ReactNode;
  className?: string;
  /** Degrees of rotation. */
  rotate?: number;
  /** Add hover lift + extra shadow (detail page hero price). */
  peelable?: boolean;
}) {
  const inner = (
    <div
      className={`inline-block px-3 py-1.5 mono text-sm font-black tabular-nums border border-[color:var(--foreground)]/25 bg-[color:var(--accent-ink)]/85 text-[color:var(--foreground)] shadow-paper ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
  if (!peelable) return inner;
  return (
    <span className="inline-block motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-sticker motion-safe:focus-within:-translate-y-1 motion-safe:focus-within:shadow-sticker">
      {inner}
    </span>
  );
}
