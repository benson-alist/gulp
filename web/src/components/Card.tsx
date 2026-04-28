import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** When true, apply hover lift / peel interaction. */
  peel?: boolean;
};

/**
 * Raised surface with optional ``sticker-peel`` hover (flea-market cards).
 */
export default function Card({
  children,
  peel = false,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] ${peel ? "sticker-peel" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
