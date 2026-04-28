"use client";

/**
 * Client-side auth state for Gulp.
 *
 * The FastAPI service is the authority — it issues and validates a
 * cookie-based JWT. This module maintains a *cache* of the currently
 * authed user so React components don't have to re-fetch `/auth/me` on
 * every render. It:
 *
 *   - Calls `GET /auth/me` once on mount to hydrate the user.
 *   - Exposes `login`, `register`, and `logout` helpers that keep the
 *     cache in sync after each mutation.
 *   - Re-hydrates from the API when tabs regain focus, so logging out in
 *     one tab promptly propagates to the others.
 *
 * Because the token is in an HttpOnly cookie, JavaScript never sees it —
 * we only cache the `Me` projection returned by the API.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, ApiError, type Me } from "@/lib/api";

type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  user: Me | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<Me>;
  register: (payload: {
    email: string;
    username: string;
    display_name: string;
    password: string;
  }) => Promise<Me>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Root provider; mount once near the top of the app tree. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  // Guard against StrictMode double-invocation hydrating twice.
  const hydrated = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
      setStatus("authed");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setStatus("anon");
        return;
      }
      // Network errors leave the cached state alone so offline users
      // don't bounce out of authed UI.
      setStatus((s) => (s === "loading" ? "anon" : s));
    }
  }, []);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const me = await api.login({ email, password });
      setUser(me);
      setStatus("authed");
      return me;
    },
    [],
  );

  const register = useCallback(
    async (payload: {
      email: string;
      username: string;
      display_name: string;
      password: string;
    }) => {
      const me = await api.register(payload);
      setUser(me);
      setStatus("authed");
      return me;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStatus("anon");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Read the current auth state.
 *
 * Must be called inside an `AuthProvider`. Throws otherwise so mistakes
 * fail loudly in dev rather than silently return `null`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
