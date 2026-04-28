import type { ReactNode } from "react";

/**
 * Small uppercase tag for filters and metadata chips.
 */
export default function Tag({
  children,
  active,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${
        active
          ? "bg-[color:var(--foreground)] text-[color:var(--background)] border-[color:var(--foreground)]"
          : "bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--foreground)]"
      } ${className}`}
    >
      {children}
    </span>
  );
}
