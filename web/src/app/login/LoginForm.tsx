"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

/**
 * Email + password login form.
 *
 * Honors a `?next=` query param so protected routes can bounce users
 * through login and back. Falls back to `/` if the param is absent or
 * points somewhere off-site.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
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
    setBusy(true);
    setError("");
    try {
      await login(email.trim().toLowerCase(), password);
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign you in.");
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
          Password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
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
        {busy ? "Signing in…" : "Back to the cupboard"}
      </button>

      <div className="text-sm text-[color:var(--muted)] text-center">
        New here?{" "}
        <Link
          href={
            nextPath === "/dashboard"
              ? "/register"
              : `/register?next=${encodeURIComponent(nextPath)}`
          }
          className="font-semibold text-[color:var(--foreground)] hover:underline"
        >
          Create an account
        </Link>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] bg-[color:var(--card)] text-sm";
