"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

const HANDLE_RE = /^[A-Za-z0-9_]{2,64}$/;

/**
 * Self-signup form.
 *
 * Collects email + public handle + display name + password, kicks off
 * the API call through the auth provider (which sets the cookie and
 * updates the cached user), then redirects to `?next=` or `/`.
 */
export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!HANDLE_RE.test(username)) {
      setError("Handle must be 2–64 letters, numbers, or underscores.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        display_name: displayName.trim() || username.trim(),
        password,
      });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1">
        <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@wherever.com"
        />
      </label>

      <label className="grid gap-1">
        <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
          Handle (shows on listings + offers)
        </span>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputCls}
          placeholder="shelf_saver"
          minLength={2}
          maxLength={64}
          pattern="^[A-Za-z0-9_]{2,64}$"
        />
      </label>

      <label className="grid gap-1">
        <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
          Display name
        </span>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputCls}
          placeholder="Shelf Saver"
          maxLength={128}
        />
      </label>

      <label className="grid gap-1">
        <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
          Password (8+ characters)
        </span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
          minLength={8}
        />
      </label>

      {error && (
        <div role="alert" className="text-[color:var(--danger)] text-sm mono">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-[48px] bg-[color:var(--foreground)] text-[color:var(--background)] px-6 py-3 rounded-full font-black hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition disabled:opacity-60"
      >
        {busy ? "Provisioning the cupboard…" : "Claim my handle"}
      </button>

      <div className="text-sm text-[color:var(--muted)] text-center">
        Already have an account?{" "}
        <Link
          href={
            nextPath === "/dashboard"
              ? "/login"
              : `/login?next=${encodeURIComponent(nextPath)}`
          }
          className="font-semibold text-[color:var(--foreground)] hover:underline"
        >
          Log in
        </Link>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] bg-[color:var(--card)] text-sm";
