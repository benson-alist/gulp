import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        muted: "var(--muted)",
        card: "var(--card)",
        border: "var(--border)",
        success: "var(--success)",
        danger: "var(--danger)",
        "ink-mustard": "var(--ink-mustard)",
        "ink-plum": "var(--ink-plum)",
        "ink-sky": "var(--ink-sky)",
        "ink-blush": "var(--ink-blush)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace"],
      },
      boxShadow: {
        sticker: "var(--shadow-sticker)",
        paper: "var(--shadow-paper)",
      },
    },
  },
  plugins: [],
} satisfies Config;
