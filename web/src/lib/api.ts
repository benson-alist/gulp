/**
 * Typed fetch client for the Gulp FastAPI service (v2).
 *
 * v2 drops the sneaker-marketplace triad (lowest_ask / highest_bid /
 * last_sale) in favour of a single `price` plus an optional
 * `original_price` anchor. Offers are either `claim` (take it home at
 * asking) or `offer` (a lower proposal).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type DrinkwareType =
  | "mug"
  | "glass"
  | "wine_glass"
  | "pint_glass"
  | "water_bottle"
  | "shot_glass"
  | "travel_mug"
  | "tumbler"
  | "novelty";

export type AcquisitionSource =
  | "gift"
  | "trend"
  | "conference"
  | "souvenir"
  | "inherited"
  | "impulse_buy";

export type SortKey =
  | "trending"
  | "price_asc"
  | "price_desc"
  | "shame_desc"
  | "newest"
  | "longest_shelf";

export type User = {
  id: number;
  username: string;
  display_name: string;
  verified: boolean;
};

export type Item = {
  id: number;
  title: string;
  brand: string;
  drinkware_type: DrinkwareType;
  acquisition_source: AcquisitionSource;
  size_oz: number;
  material: string;
  colorway: string;
  condition: string;
  confession: string;
  shame_index: number;
  years_in_cupboard: number;
  image_emoji: string;
  price: number;
  original_price: number | null;
  is_sold: boolean;
  created_at: string;
  seller: User;
};

export type Stats = {
  total_items: number;
  cupboard_years_liberated: number;
  average_shame: number;
  confessions_on_file: number;
  total_offers: number;
  value_liberated_usd: number;
};

export type TypeCount = { drinkware_type: DrinkwareType; count: number };

export type ItemPage = {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
};

export type Offer = {
  id: number;
  item_id: number;
  buyer_username: string;
  price: number;
  kind: "claim" | "offer";
  status: string;
  message: string;
  created_at: string;
};

/** Make a JSON request; throw on non-2xx. */
async function req<T>(
  path: string,
  init?: RequestInit,
  opts: { revalidate?: number; cache?: RequestCache } = {},
): Promise<T> {
  const next =
    opts.revalidate !== undefined ? { revalidate: opts.revalidate } : undefined;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: opts.cache ?? "no-store",
    next,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return (await res.json()) as T;
}

export type ItemsQuery = {
  q?: string;
  drinkware_type?: DrinkwareType | string;
  acquisition_source?: AcquisitionSource | string;
  sort?: SortKey;
  limit?: number;
  offset?: number;
};

/** Build the querystring for `/items` from a typed filter object. */
function itemsQs(params?: ItemsQuery): string {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.drinkware_type) qs.set("drinkware_type", params.drinkware_type);
  if (params?.acquisition_source)
    qs.set("acquisition_source", params.acquisition_source);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  return qs.toString() ? `?${qs}` : "";
}

type FetchOpts = { revalidate?: number; cache?: RequestCache };

export const api = {
  health: () =>
    req<{ status: string; service: string; slogan: string }>("/health"),
  stats: (opts?: FetchOpts) => req<Stats>("/stats", undefined, opts),
  /** Returns just the items array (back-compat helper). */
  items: (params?: ItemsQuery, opts?: FetchOpts) =>
    req<ItemPage>(`/items${itemsQs(params)}`, undefined, opts).then(
      (p) => p.items,
    ),
  /** Returns the full page object so callers can paginate. */
  itemsPage: (params?: ItemsQuery, opts?: FetchOpts) =>
    req<ItemPage>(`/items${itemsQs(params)}`, undefined, opts),
  types: (opts?: FetchOpts) => req<TypeCount[]>("/items/types", undefined, opts),
  item: (id: number | string, opts?: FetchOpts) =>
    req<Item>(`/items/${id}`, undefined, opts),
  offers: (limit = 20, opts?: FetchOpts) =>
    req<Offer[]>(`/offers?limit=${limit}`, undefined, opts),
  createItem: (payload: {
    title: string;
    brand: string;
    drinkware_type: DrinkwareType;
    acquisition_source: AcquisitionSource;
    size_oz: number;
    material: string;
    colorway: string;
    condition: string;
    confession?: string;
    shame_index: number;
    years_in_cupboard: number;
    image_emoji?: string;
    price: number;
    original_price?: number | null;
    seller_username: string;
  }) =>
    req<Item>("/items", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  claim: (payload: {
    item_id: number;
    buyer_username: string;
    message?: string;
  }) =>
    req<Offer>("/offers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  makeOffer: (payload: {
    item_id: number;
    buyer_username: string;
    price: number;
    message?: string;
  }) =>
    req<Offer>("/offers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Format a USD amount; no fractional cents unless `cents` is true. */
export function formatUSD(n: number, opts: { cents?: boolean } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(n);
}

/** Percent-off between `original_price` and `price`. Returns 0 when missing or negative. */
export function discountPct(price: number, original: number | null): number {
  if (!original || original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

export const DRINKWARE_LABELS: Record<DrinkwareType, string> = {
  mug: "Mug",
  glass: "Glass",
  wine_glass: "Wine",
  pint_glass: "Pint",
  water_bottle: "Water bottle",
  shot_glass: "Shot glass",
  travel_mug: "Travel mug",
  tumbler: "Tumbler",
  novelty: "Novelty",
};

export const DRINKWARE_EMOJI: Record<DrinkwareType, string> = {
  mug: "☕️",
  glass: "🥛",
  wine_glass: "🍷",
  pint_glass: "🍺",
  water_bottle: "🧴",
  shot_glass: "🥃",
  travel_mug: "🥤",
  tumbler: "🫙",
  novelty: "🫠",
};

export const SOURCE_LABELS: Record<AcquisitionSource, string> = {
  gift: "Gift",
  trend: "Trend tax",
  conference: "Conference swag",
  souvenir: "Friend-who-travelled",
  inherited: "Inherited",
  impulse_buy: "Impulse buy",
};
