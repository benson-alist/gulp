import Link from "next/link";
import {
  DRINKWARE_LABELS,
  DrinkwareType,
  SOURCE_LABELS,
  AcquisitionSource,
  SortKey,
  api,
} from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import BrowseChipLink from "@/components/BrowseChipLink";
import BrowseControls from "./BrowseControls";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type Sort = SortKey;

type Search = {
  q?: string;
  drinkware_type?: DrinkwareType;
  acquisition_source?: AcquisitionSource;
  sort?: string;
  offset?: string;
};

const VALID_SORTS: Sort[] = [
  "trending",
  "price_asc",
  "price_desc",
  "newest",
  "longest_shelf",
];

function normalizeSort(raw: string | undefined): Sort {
  if (raw && VALID_SORTS.includes(raw as Sort)) return raw as Sort;
  return "trending";
}

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
  const raw = await searchParams;
  const sort = normalizeSort(raw.sort);
  const params: Search = { ...raw, sort };
  const offset = Math.max(0, Number(params.offset ?? "0") || 0);
  const [page, types] = await Promise.all([
    api
      .itemsPage({
        q: params.q,
        drinkware_type: params.drinkware_type,
        acquisition_source: params.acquisition_source,
        sort: sort,
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
          <div className="t-eyebrow">The whole cupboard</div>
          <h1 className="mt-1 t-display">Browse all drinkware</h1>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Showing {items.length === 0 ? 0 : page.offset + 1}–
            {page.offset + items.length} of {page.total} · priced, rehomable,
            mostly dishwasher safe · one of these could be your new
            favourite cup
          </div>
        </div>
      </div>

      {/* `py-2 -my-1` reserves vertical room inside the horizontal scroll
          container so chips' sticker-shadow and slight rotation aren't clipped
          on mobile (overflow-x:auto becomes a 2D scroll container). */}
      <div className="mt-5 -my-1 py-2 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <BrowseChipLink
          href={buildHref(params, { drinkware_type: undefined })}
          active={!params.drinkware_type}
        >
          All
        </BrowseChipLink>
        {DRINKWARE_ORDER.map((t) => (
          <BrowseChipLink
            key={t}
            href={buildHref(params, { drinkware_type: t })}
            active={params.drinkware_type === t}
          >
            {DRINKWARE_LABELS[t]}
            <span className="ml-1 mono text-[10px] opacity-60">
              {typeCounts[t] ?? 0}
            </span>
          </BrowseChipLink>
        ))}
      </div>

      <div className="mt-3 -my-1 py-2 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <BrowseChipLink
          href={buildHref(params, { acquisition_source: undefined })}
          active={!params.acquisition_source}
          small
        >
          Any origin
        </BrowseChipLink>
        {SOURCE_ORDER.map((s) => (
          <BrowseChipLink
            key={s}
            href={buildHref(params, { acquisition_source: s })}
            active={params.acquisition_source === s}
            small
          >
            {SOURCE_LABELS[s]}
          </BrowseChipLink>
        ))}
      </div>

      <BrowseControls
        defaultQ={params.q ?? ""}
        defaultSort={sort}
      />

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing matched those filters."
            body="Try loosening a chip or two."
            ctaHref="/browse"
            ctaLabel="Reset filters"
            mascotSrc="/hero.png"
            mascotAlt="Friendly drinkware mascot"
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((l) => (
              <div
                key={l.id}
                className="h-full"
                style={{ transform: `rotate(${((l.id % 5) - 2) * 0.55}deg)` }}
              >
                <ItemCard item={l} />
              </div>
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
                  ← Earlier listings
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
                  Deeper into the cupboard →
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

