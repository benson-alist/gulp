"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth";

/**
 * Avatar-triggered dropdown used in the site header.
 *
 * Matches the convention on most marketplaces and SaaS apps: click the
 * user avatar in the top-right, a menu appears with identity details,
 * profile/settings navigation, and a destructive Sign-out action.
 *
 * Accessibility:
 *   - The trigger is a `<button aria-haspopup aria-expanded>`; the menu
 *     has `role="menu"` and each row is a `role="menuitem"`.
 *   - Outside clicks, Escape, and navigation close the menu.
 *   - When the auth state is still hydrating we render an invisible slot
 *     of the same width so the header doesn't jump.
 */
export default function UserMenu() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return <span className="inline-block w-9 h-9" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Link
          href="/login"
          className="px-3 py-1.5 rounded-full hover:bg-[color:var(--card)] transition"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="px-3 py-1.5 rounded-full border border-[color:var(--foreground)] hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition font-semibold"
        >
          Sign up
        </Link>
      </div>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      setOpen(false);
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/sell") ||
        pathname.includes("/edit")
      ) {
        router.push("/");
      } else {
        router.refresh();
      }
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for @${user.username}`}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[color:var(--card)] transition"
      >
        <Avatar
          displayName={user.display_name}
          username={user.username}
          avatarUrl={user.avatar_url}
          sizePx={32}
        />
        <span className="hidden sm:inline text-sm font-semibold">
          {user.display_name.split(" ")[0]}
        </span>
        <span aria-hidden className="hidden sm:inline text-[color:var(--muted)]">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 mt-2 w-64 rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--background)] shadow-paper overflow-hidden z-40"
        >
          <div className="px-4 py-3 border-b border-[color:var(--border)] bg-[color:var(--card)]">
            <div className="flex items-center gap-3">
              <Avatar
                displayName={user.display_name}
                username={user.username}
                avatarUrl={user.avatar_url}
                sizePx={40}
              />
              <div className="min-w-0">
                <div className="font-bold truncate">{user.display_name}</div>
                <div className="mono text-[11px] text-[color:var(--muted)] truncate">
                  @{user.username}
                </div>
              </div>
            </div>
            <div className="mono text-[11px] text-[color:var(--muted)] truncate mt-2">
              {user.email}
            </div>
          </div>

          <MenuLink href="/dashboard">Your dashboard</MenuLink>
          <MenuLink href="/sell">List a cup</MenuLink>
          <MenuLink href={`/u/${user.username}`}>Your public shelf</MenuLink>
          <MenuLink href="/dashboard?tab=settings">Settings</MenuLink>

          <div className="h-px bg-[color:var(--border)]" />

          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-[color:var(--danger)] hover:bg-[color:var(--card)] disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="block px-4 py-2.5 text-sm hover:bg-[color:var(--card)]"
    >
      {children}
    </Link>
  );
}
