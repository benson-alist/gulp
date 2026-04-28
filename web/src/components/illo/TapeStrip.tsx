import type { ReactNode } from "react";

/**
 * Translucent “masking tape” strip for prices or labels.
 */
export default function TapeStrip({
  children,
  className = "",
  rotate = -2,
}: {
  children: ReactNode;
  className?: string;
  /** Degrees of rotation. */
  rotate?: number;
}) {
  return (
    <div
      className={`inline-block px-3 py-1.5 mono text-sm font-black tabular-nums border border-[color:var(--foreground)]/25 bg-[color:var(--accent-ink)]/85 text-[color:var(--foreground)] shadow-paper ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}
