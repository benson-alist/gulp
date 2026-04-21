"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sticky bottom tab bar shown on viewports below `md`.
 *
 * Collapses into the header-based navigation at `md` and up so it never
 * competes with the desktop links. Every target is ≥44px tall for
 * touch-friendliness.
 */
export default function MobileTabBar() {
  const pathname = usePathname();
  const tabs: { href: string; label: string; icon: string }[] = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/browse", label: "Browse", icon: "🔎" },
    { href: "/sell", label: "Sell", icon: "➕" },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[color:var(--border)] bg-[color:var(--background)]/95 backdrop-blur"
    >
      <ul className="grid grid-cols-3">
        {tabs.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-[11px] mono uppercase tracking-wider ${
                  active
                    ? "text-[color:var(--accent)] font-bold"
                    : "text-[color:var(--muted)]"
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
