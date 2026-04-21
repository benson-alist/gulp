import Link from "next/link";
import {
  DRINKWARE_LABELS,
  DrinkwareType,
  SOURCE_LABELS,
  AcquisitionSource,
  api,
} from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import BrowseControls from "./BrowseControls";

export const dynamic = "force-dynamic";

type Sort =
  | "trending"
  | "price_asc"
  | "price_desc"
  | "shame_desc"
  | "newest"
  | "longest_shelf";

type Search = {
  q?: string;
  drinkware_type?: DrinkwareType;
  acquisition_source?: AcquisitionSource;
  sort?: Sort;
  offset?: string;
};

const PAGE_SIZE = 48;

const DRINKWARE_ORDER: DrinkwareType[] = [
  "mug",
  "water_bottle",
  "shot_glass",
  "wine_glass",
  "pint_glass",
  "glass",
  "travel_mug",
  "tumbler",
  "novelty",
];

const SOURCE_ORDER: AcquisitionSource[] = [
  "trend",
  "souvenir",
  "conference",
  "gift",
  "inherited",
  "impulse_buy",
];

/** Browse page with type + source filters, search, and sort. */
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const offset = Math.max(0, Number(params.offset ?? "0") || 0);
  const [page, types] = await Promise.all([
    api
      .itemsPage({
        q: params.q,
        drinkware_type: params.drinkware_type,
        acquisition_source: params.acquisition_source,
        sort: params.sort ?? "trending",
        limit: PAGE_SIZE,
        offset,
      })
      .catch(() => ({ items: [], total: 0, limit: PAGE_SIZE, offset: 0 })),
    api.types().catch(() => []),
  ]);

  const items = page.items;
  const hasPrev = page.offset > 0;
  const hasNext = page.offset + page.items.length < page.total;

  const typeCounts = Object.fromEntries(
    types.map((t) => [t.drinkware_type, t.count]),
  ) as Record<DrinkwareType, number>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
            The whole cupboard
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">
            Browse all drinkware
          </h1>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Showing {items.length === 0 ? 0 : page.offset + 1}–
            {page.offset + items.length} of {page.total} · confessed, priced,
            still dishwasher safe · any one of these could be your next
            confession
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <Chip
          href={buildHref(params, { drinkware_type: undefined })}
          active={!params.drinkware_type}
        >
          All
        </Chip>
        {DRINKWARE_ORDER.map((t) => (
          <Chip
            key={t}
            href={buildHref(params, { drinkware_type: t })}
            active={params.drinkware_type === t}
          >
            {DRINKWARE_LABELS[t]}
            <span className="ml-1 mono text-[10px] opacity-60">
              {typeCounts[t] ?? 0}
            </span>
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <Chip
          href={buildHref(params, { acquisition_source: undefined })}
          active={!params.acquisition_source}
          small
        >
          Any origin
        </Chip>
        {SOURCE_ORDER.map((s) => (
          <Chip
            key={s}
            href={buildHref(params, { acquisition_source: s })}
            active={params.acquisition_source === s}
            small
          >
            {SOURCE_LABELS[s]}
          </Chip>
        ))}
      </div>

      <BrowseControls
        defaultQ={params.q ?? ""}
        defaultSort={params.sort ?? "trending"}
      />

      {items.length === 0 ? (
        <div className="mt-10 border border-dashed border-[color:var(--border)] rounded-2xl p-10 text-center">
          <div className="text-5xl" aria-hidden>
            🫗
          </div>
          <div className="mt-3 font-bold">Nothing matched.</div>
          <div className="text-sm text-[color:var(--muted)]">
            Loosen the grip on your filters — or your cupboard.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((l) => (
              <ItemCard key={l.id} item={l} />
            ))}
          </div>

          {(hasPrev || hasNext) && (
            <nav
              aria-label="Pagination"
              className="mt-10 flex items-center justify-between gap-3"
            >
              {hasPrev ? (
                <Link
                  href={buildHref(params, {
                    offset:
                      page.offset - PAGE_SIZE > 0
                        ? String(page.offset - PAGE_SIZE)
                        : undefined,
                  })}
                  className="px-4 py-2 rounded-full border border-[color:var(--border)] text-sm hover:border-[color:var(--foreground)]"
                >
                  ← Earlier regrets
                </Link>
              ) : (
                <span />
              )}
              <span className="mono text-[11px] uppercase text-[color:var(--muted)]">
                Page {Math.floor(page.offset / PAGE_SIZE) + 1} of{" "}
                {Math.max(1, Math.ceil(page.total / PAGE_SIZE))}
              </span>
              {hasNext ? (
                <Link
                  href={buildHref(params, {
                    offset: String(page.offset + PAGE_SIZE),
                  })}
                  className="px-4 py-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-semibold"
                >
                  More shelf sentences →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

/** Build a `/browse` href that merges current search params with overrides.
 *
 * Changing filters (anything other than `offset`) resets pagination to the
 * first page — otherwise users on page 3 would land on page 3 of a different
 * filtered list and wonder why their filter shows "0 results".
 */
function buildHref(
  current: Search,
  patch: Partial<Record<keyof Search, string | undefined>>,
): string {
  const patchResetsOffset = Object.keys(patch).some((k) => k !== "offset");
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({
    ...current,
    ...(patchResetsOffset ? { offset: undefined } : {}),
    ...patch,
  })) {
    if (v) merged[k] = String(v);
  }
  const qs = new URLSearchParams(merged).toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

/** Rounded filter chip used in both chip rows. */
function Chip({
  href,
  active,
  small,
  children,
}: {
  href: string;
  active?: boolean;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border ${
        small ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
      } transition ${
        active
          ? "bg-[color:var(--foreground)] text-[color:var(--background)] border-[color:var(--foreground)]"
          : "border-[color:var(--border)] hover:border-[color:var(--foreground)]"
      }`}
    >
      {children}
    </Link>
  );
}
