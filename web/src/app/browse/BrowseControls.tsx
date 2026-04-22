"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { SortKey } from "@/lib/api";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "longest_shelf", label: "Longest shelf" },
  { value: "shame_desc", label: "Most character" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

/**
 * Client-side search + sort controls for the Browse page.
 *
 * Pushes updated query params via `useRouter`, preserving every other
 * active filter so the user can compose chip + sort + search freely.
 */
export default function BrowseControls({
  defaultQ,
  defaultSort,
}: {
  defaultQ: string;
  defaultSort: SortKey;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultQ);

  /** Push new query params, dropping keys whose value is empty/undefined.
   *
   * Any change resets `offset` back to page 1 — search results and sort
   * changes should always land you on the first page of the new slice.
   */
  function push(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("offset");
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    router.push(`/browse${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          push({ q: q || undefined });
        }}
        className="flex gap-2 sm:flex-1 sm:max-w-md"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, brand, or colorway…"
          aria-label="Search listings"
          className="flex-1 px-4 py-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] outline-none focus:border-[color:var(--foreground)] text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] font-semibold text-sm"
        >
          Search
        </button>
      </form>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <span className="shrink-0 mono text-[10px] uppercase text-[color:var(--muted)]">
          Sort
        </span>
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => push({ sort: o.value })}
            className={`shrink-0 px-3 py-1.5 rounded-full border text-xs transition ${
              defaultSort === o.value
                ? "bg-[color:var(--foreground)] text-[color:var(--background)] border-[color:var(--foreground)]"
                : "border-[color:var(--border)] hover:border-[color:var(--foreground)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
