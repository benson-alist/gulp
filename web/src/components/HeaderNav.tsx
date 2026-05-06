"use client";

import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Right-hand header: theme toggle, Browse + Sell (desktop), user menu.
 */
export default function HeaderNav() {
  return (
    <nav className="flex items-center gap-2 text-sm shrink-0">
      <ThemeToggle />
      <Link
        href="/browse"
        className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-transparent hover:bg-[color:var(--card)] hover:border-[color:var(--border)] transition font-medium"
      >
        Browse
      </Link>
      <Link
        href="/sell"
        className="hidden md:inline-flex px-4 py-1.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] border-2 border-[color:var(--foreground)] shadow-sticker hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition font-semibold wobble-on-tap -rotate-1 hover:rotate-0"
      >
        Sell a cup
      </Link>
      <div className="ml-0 sm:ml-1">
        <UserMenu />
      </div>
    </nav>
  );
}
