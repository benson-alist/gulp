"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Browse filter chip styled as a sticker ``Link`` (active state + peel hover).
 */
export default function BrowseChipLink({
  href,
  active,
  small,
  children,
}: {
  href: string;
  active?: boolean;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border-2 shadow-sticker sticker-peel font-semibold ${
        small ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
      } ${
        active
          ? "bg-[color:var(--foreground)] text-[color:var(--background)] border-[color:var(--foreground)] -rotate-1"
          : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--foreground)]"
      }`}
    >
      {children}
    </Link>
  );
}
