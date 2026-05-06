"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gulp-theme";

type Theme = "light" | "dark";

/**
 * Toggles ``html[data-theme]`` between light and dark, persisting to
 * ``localStorage``. Assumes :root`` / ``ThemeScript`` already ran on load.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setTheme(t === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--foreground)] transition shrink-0"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
