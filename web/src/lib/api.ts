/**
 * Typed fetch client for the Gulp FastAPI service (v3 — authenticated).
 *
 * v3 adds cookie-based JWT auth. Every request that hits the API sends
 * `credentials: "include"` so the browser attaches the `gulp_auth` cookie
 * automatically. The token never lives in JS / localStorage — the cookie
 * is HttpOnly and only readable by the API.
 *
 * Wire format is otherwise unchanged: one `price` per listing, optional
 * `original_price` anchor, offers are either `claim` (take it home) or
 * `offer` (lower proposal).
 */

// Default to `localhost` (not `127.0.0.1`) so the auth cookie set on the
// API host is also visible to the Next.js middleware running on
// `localhost:3000` — cookies without an explicit Domain are shared across
// ports on the same hostname, but not across different hostnames.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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
  | "newest"
  | "longest_shelf";

export type User = {
  id: number;
  username: string;
  display_name: string;
  verified: boolean;
  avatar_url: string | null;
};

export type Me = User & { email: string; created_at: string };

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
  years_in_cupboard: number;
  image_emoji: string;
  image_url: string | null;
  price: number;
  original_price: number | null;
  is_sold: boolean;
  /** Final sale price when rehomed (claim or settled flip); omitted if unknown. */
  sold_price?: number | null;
  /** True when `image_url` is a client-rasterized auto-cover (skip live decals). */
  cover_is_generated?: boolean;
  created_at: string;
  seller: User;
};

export type Stats = {
  total_items: number;
  cupboard_years_liberated: number;
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

export type FlipOutcome = "win" | "lose";

export type OfferKind = "claim" | "offer" | "flip";

export type OfferStatus =
  | "claimed"
  | "awaiting_seller"
  | "rejected"
  | "withdrawn"
  | "flipped_won"
  | "flipped_lost";

export type Offer = {
  id: number;
  item_id: number;
  buyer: User;
  price: number;
  kind: OfferKind;
  status: OfferStatus;
  message: string;
  /** Buyer-win price for a flip. `null` for claims and regular offers. */
  low_price: number | null;
  /** Buyer-lose price for a flip. `null` for claims and regular offers. */
  high_price: number | null;
  /** `"win"` = buyer pays `low_price`, `"lose"` = buyer pays `high_price`. */
  flip_outcome: FlipOutcome | null;
  /** Set after the buyer opens the post-flip reveal (`POST /offers/{id}/view`). */
  viewed_by_buyer_at: string | null;
  created_at: string;
};

export type OfferWithItem = Offer & { item: Item };

/** Error thrown by `req` so callers can branch on HTTP status. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Best-effort extraction of FastAPI's `{detail: "..."}` error shape. */
function parseDetail(body: string): string | null {
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed.detail === "string") return parsed.detail;
  } catch {
    /* not JSON — fall through */
  }
  return null;
}

/** Make a JSON request; throw an `ApiError` on non-2xx. */
async function req<T>(
  path: string,
  init?: RequestInit,
  opts: { revalidate?: number; cache?: RequestCache } = {},
): Promise<T> {
  const next =
    opts.revalidate !== undefined ? { revalidate: opts.revalidate } : undefined;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: opts.cache ?? "no-store",
    next,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const detail = parseDetail(body);
    throw new ApiError(
      res.status,
      body,
      detail ?? `API ${path} failed (${res.status})`,
    );
  }
  if (res.status === 204) return undefined as T;
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

export type ItemCreateInput = {
  title: string;
  brand: string;
  drinkware_type: DrinkwareType;
  acquisition_source: AcquisitionSource;
  size_oz: number;
  material: string;
  colorway: string;
  condition: string;
  years_in_cupboard: number;
  image_emoji?: string;
  image_url?: string | null;
  cover_is_generated?: boolean;
  price: number;
  original_price?: number | null;
};

export type ItemUpdateInput = Partial<ItemCreateInput> & {
  is_sold?: boolean;
};

export type MeUpdateInput = {
  display_name?: string;
  email?: string;
  avatar_url?: string | null;
};

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

  /** Create a listing owned by the currently authenticated user. */
  createItem: (payload: ItemCreateInput) =>
    req<Item>("/items", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Partial-update a listing you own. */
  updateItem: (id: number, payload: ItemUpdateInput) =>
    req<Item>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /** Claim at asking price. Buyer = authenticated user. */
  claim: (payload: { item_id: number; message?: string }) =>
    req<Offer>("/offers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Submit a lower bid. Must be strictly less than asking. */
  makeOffer: (payload: {
    item_id: number;
    price: number;
    message?: string;
  }) =>
    req<Offer>("/offers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Coin flip: `low_price` if the buyer wins, `high_price` if they lose.
   * The API enforces `low < asking < high` and resolves the flip immediately.
   */
  proposeFlip: (payload: {
    item_id: number;
    low_price: number;
    high_price: number;
    message?: string;
  }) =>
    req<Offer>("/offers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Seller-only: reject a pending lower offer. */
  rejectOffer: (offerId: number) =>
    req<Offer>(`/offers/${offerId}/reject`, { method: "POST" }),

  /**
   * Buyer-only: mark a resolved flip as viewed (idempotent). Sets
   * `viewed_by_buyer_at` on first call.
   */
  markFlipViewed: (offerId: number) =>
    req<Offer>(`/offers/${offerId}/view`, { method: "POST" }),

  /** Seller-only: offers received on a specific listing. */
  offersForItem: (itemId: number) =>
    req<Offer[]>(`/items/${itemId}/offers`),

  /** Seller dashboard: every listing owned by the current user. */
  myItems: () => req<Item[]>("/users/me/items"),

  /** Buyer dashboard: every offer the current user has placed. */
  myBids: () => req<OfferWithItem[]>("/users/me/bids"),

  /** Public: all active listings for a given seller handle. */
  sellerItems: (username: string, opts?: FetchOpts) =>
    req<Item[]>(`/users/${username}/items`, undefined, opts),

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  register: (payload: {
    email: string;
    username: string;
    display_name: string;
    password: string;
  }) =>
    req<Me>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    req<Me>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () => req<void>("/auth/logout", { method: "POST" }),

  me: () => req<Me>("/auth/me"),

  /** Update the authenticated user's profile (partial). */
  updateMe: (payload: MeUpdateInput) =>
    req<Me>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /** Change password; API returns 204 and refreshes the session cookie. */
  changePassword: (payload: {
    current_password: string;
    new_password: string;
  }) =>
    req<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Delete the authenticated account after handle confirmation. */
  deleteMe: (payload: { confirm_username: string }) =>
    req<void>("/users/me", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),

  /**
   * Upload a listing photo (auth required). Returns an absolute URL the
   * caller can store in `image_url`. Uses multipart/form-data directly (not
   * `req`) because the browser must set the boundary itself.
   */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/uploads/image`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const detail = parseDetail(body);
      throw new ApiError(res.status, body, detail ?? `Upload failed (${res.status})`);
    }
    return (await res.json()) as { url: string };
  },
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
