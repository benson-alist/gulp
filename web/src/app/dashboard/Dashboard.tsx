"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  DRINKWARE_LABELS,
  api,
  formatUSD,
  type Item,
  type Offer,
  type OfferWithItem,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCalendarDateUTC } from "@/lib/formatDate";
import CoinFlipModal, {
  COIN_FLIP_SPIN_MS,
  type CoinFlipPhase,
} from "@/components/CoinFlipModal";
import ProfileHeader from "./ProfileHeader";
import SettingsTab from "./SettingsTab";
import EmptyState from "@/components/EmptyState";

type Tab = "listings" | "bids" | "settings";

/**
 * The dashboard surface: tabs for "my listings" and "my bids".
 *
 * Data loads in parallel on mount so switching tabs is instant. Unauthed
 * visitors are bounced to `/login?next=/dashboard` — the middleware also
 * enforces this, but this is a belt-and-braces UX: if the cookie expires
 * in place, we handle the 401 gracefully.
 */
/** Parse a value from `?tab=` into the `Tab` union, defaulting to listings. */
function toTab(raw: string | null | undefined): Tab {
  return raw === "bids" || raw === "settings" ? raw : "listings";
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();
  const initialTab = toTab(searchParams.get("tab"));
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(toTab(searchParams.get("tab")));
  }, [searchParams]);

  /**
   * Keep the active tab in the URL (`?tab=`) so deep links, refresh, and
   * browser back/forward stay in sync with the local tab state.
   */
  function selectTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "listings") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }

  const [items, setItems] = useState<Item[] | null>(null);
  const [bids, setBids] = useState<OfferWithItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "anon") {
      router.replace("/login?next=/dashboard");
      return;
    }
    if (status !== "authed") return;

    let cancelled = false;
    (async () => {
      try {
        const [myItems, myBids] = await Promise.all([
          api.myItems(),
          api.myBids(),
        ]);
        if (cancelled) return;
        setItems(myItems);
        setBids(myBids);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login?next=/dashboard");
          return;
        }
        setItems([]);
        setBids([]);
        setError(err instanceof Error ? err.message : "Couldn't load your cupboard.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const dataLoading =
    status === "authed" && items === null && bids === null && !error;
  if (status === "loading" || dataLoading) {
    return <DashboardSkeleton />;
  }
  if (!user) return null;

  const safeItems = items ?? [];
  const safeBids = bids ?? [];

  return (
    <div>
      <div className="t-eyebrow">Your cupboard</div>
      <p className="mt-2 text-[color:var(--muted)] text-sm max-w-2xl">
        Listings, bids, and the knobs on your account — all in one place.
      </p>

      <div className="mt-6">
        <ProfileHeader user={user} items={safeItems} bids={safeBids} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-b-2 border-[color:var(--border)] pb-0">
        <TabButton
          active={tab === "listings"}
          onClick={() => selectTab("listings")}
        >
          My listings
          <Pill>{safeItems.length}</Pill>
        </TabButton>
        <TabButton active={tab === "bids"} onClick={() => selectTab("bids")}>
          My bids
          <Pill>{safeBids.length}</Pill>
        </TabButton>
        <TabButton
          active={tab === "settings"}
          onClick={() => selectTab("settings")}
        >
          Settings
        </TabButton>
        <div className="ml-auto pb-2 w-full sm:w-auto flex justify-end">
          <Link
            href="/sell"
            className="text-xs mono uppercase tracking-wider px-4 py-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] border-2 border-[color:var(--foreground)] shadow-sticker hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition wobble-on-tap -rotate-1 hover:rotate-0"
          >
            + List a cup
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 text-[color:var(--danger)] text-sm mono">
          {error}
        </div>
      )}

      <div className="mt-6">
        {tab === "listings" ? (
          <ListingsTab items={safeItems} />
        ) : tab === "bids" ? (
          <BidsTab
            bids={safeBids}
            onBidPatch={(next) => {
              setBids((prev) =>
                prev?.map((b) => (b.id === next.id ? next : b)) ?? null,
              );
            }}
          />
        ) : (
          <SettingsTab />
        )}
      </div>
    </div>
  );
}

function ListingsTab({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No cups listed yet."
        body="Liberate a mug. The cupboard is waiting."
        ctaHref="/sell"
        ctaLabel="List a cup"
        mascotSrc="/hero.png"
        mascotAlt="Friendly drinkware"
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <SellerItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function SellerItemRow({ item }: { item: Item }) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && offers === null) {
      setLoading(true);
      try {
        const rows = await api.offersForItem(item.id);
        setOffers(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load bids.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-[#f2ead8] via-[#e8d4b8] to-[#c26b4e]/55 flex items-center justify-center shrink-0">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="text-3xl" aria-hidden>
              {item.image_emoji}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/listing/${item.id}`}
              className="font-bold leading-tight line-clamp-2 hover:underline"
            >
              {item.title}
            </Link>
            <div className="text-right shrink-0">
              <div className="font-black leading-none">{formatUSD(item.price)}</div>
              <div className="mono text-[10px] uppercase text-[color:var(--muted)] mt-1">
                {DRINKWARE_LABELS[item.drinkware_type]}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs mono">
            {item.is_sold && (
              <span className="px-2 py-0.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] uppercase tracking-wider">
                Rehomed
              </span>
            )}
            {!item.is_sold && (
              <Link
                href={`/listing/${item.id}/edit`}
                className="px-2 py-0.5 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--background)] uppercase tracking-wider"
              >
                Edit
              </Link>
            )}
            <button
              onClick={toggle}
              className="px-2 py-0.5 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--background)] uppercase tracking-wider"
            >
              {open ? "Hide bids" : "View bids"}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="border-t border-[color:var(--border)] bg-[color:var(--background)]/50 px-3 py-3">
          {loading ? (
            <div className="text-xs mono text-[color:var(--muted)]">Loading bids…</div>
          ) : error ? (
            <div className="text-xs mono text-[color:var(--danger)]" role="alert">
              {error}
            </div>
          ) : offers && offers.length > 0 ? (
            <ul className="space-y-2">
              {offers.map((o) => (
                <OfferRow key={o.id} offer={o} askingPrice={item.price} />
              ))}
            </ul>
          ) : (
            <div className="text-xs mono text-[color:var(--muted)]">
              No bids yet. Even cups have waiting lists.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OfferRow({
  offer,
  askingPrice,
}: {
  offer: Offer;
  askingPrice: number;
}) {
  const kindLabel =
    offer.kind === "claim"
      ? "Claimed at asking"
      : offer.kind === "flip"
        ? "Coin flip"
        : "Lowball offer";
  const diffPct =
    offer.kind === "offer" && askingPrice > 0
      ? Math.round((1 - offer.price / askingPrice) * 100)
      : 0;

  const isResolvedFlip =
    offer.kind === "flip" &&
    (offer.status === "flipped_won" || offer.status === "flipped_lost");

  return (
    <li className="text-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] flex items-center justify-center font-black text-[11px]">
          {offer.buyer.display_name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate">
            <span className="font-semibold">{offer.buyer.display_name}</span>{" "}
            <span className="mono text-[11px] text-[color:var(--muted)]">
              @{offer.buyer.username}
            </span>
          </div>
          <div className="mono text-[11px] text-[color:var(--muted)]">
            {kindLabel}
            {diffPct > 0 ? ` · ${diffPct}% under asking` : ""}
            {offer.kind === "flip" && offer.low_price != null && offer.high_price != null
              ? ` · ${formatUSD(offer.low_price)} vs ${formatUSD(offer.high_price)}`
              : ""}
            {offer.message ? ` · "${offer.message}"` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-black leading-none">
            {formatUSD(offer.price)}
          </div>
          <div className="mono text-[10px] uppercase text-[color:var(--muted)] mt-1">
            {offer.status.replace(/_/g, " ")}
          </div>
        </div>
      </div>
      {isResolvedFlip && offer.low_price != null && offer.high_price != null && (
        <div className="mt-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]/60 p-3 mono text-[11px] uppercase tracking-wider">
          {offer.flip_outcome === "win" ? (
            <span className="text-[color:var(--success)]">
              Buyer won · settled at {formatUSD(offer.low_price)}
            </span>
          ) : (
            <span className="text-[color:var(--danger)]">
              Buyer lost · settled at {formatUSD(offer.high_price)}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

/** Resolved flip the buyer has not opened the reveal for yet. */
function isFlipRevealPending(bid: OfferWithItem): boolean {
  return (
    bid.kind === "flip" &&
    (bid.status === "flipped_won" || bid.status === "flipped_lost") &&
    !bid.viewed_by_buyer_at
  );
}

function BidsTab({
  bids,
  onBidPatch,
}: {
  bids: OfferWithItem[];
  onBidPatch: (next: OfferWithItem) => void;
}) {
  const [revealBid, setRevealBid] = useState<OfferWithItem | null>(null);
  const [revealPhase, setRevealPhase] = useState<CoinFlipPhase>("spinning");
  const [revealUpdated, setRevealUpdated] = useState<Offer | null>(null);
  const [revealError, setRevealError] = useState("");

  /**
   * Opens the shared coin modal, waits ``COIN_FLIP_SPIN_MS`` for the tumble,
   * then reveals buyer win/lose (confetti vs rain) before persisting view.
   */
  async function openReveal(bid: OfferWithItem) {
    setRevealError("");
    setRevealUpdated(null);
    setRevealBid(bid);
    setRevealPhase("spinning");
    const markPromise = api.markFlipViewed(bid.id);
    await new Promise<void>((r) => setTimeout(r, COIN_FLIP_SPIN_MS));
    setRevealPhase(bid.flip_outcome === "win" ? "win" : "lose");
    try {
      const updated = await markPromise;
      setRevealUpdated(updated);
    } catch (e) {
      setRevealError(
        e instanceof Error ? e.message : "Could not record that you saw the result.",
      );
    }
  }

  function closeReveal() {
    if (revealUpdated && revealBid) {
      const next: OfferWithItem = {
        ...revealBid,
        ...revealUpdated,
        item: revealBid.item,
      };
      onBidPatch(next);
    }
    setRevealBid(null);
    setRevealPhase("spinning");
    setRevealUpdated(null);
    setRevealError("");
  }

  const outcomeSummary =
    revealBid && revealPhase !== "spinning"
      ? revealBid.flip_outcome === "win"
        ? `You won · you pay ${formatUSD(revealBid.low_price ?? revealBid.price)} — cup rehomed for ${formatUSD(revealBid.price)}.`
        : `You lost · you pay ${formatUSD(revealBid.high_price ?? revealBid.price)} — cup rehomed for ${formatUSD(revealBid.price)}.`
      : null;

  if (bids.length === 0) {
    return (
      <EmptyState
        title="No bids placed yet."
        body="Find a cup worth living with."
        ctaHref="/browse"
        ctaLabel="Browse cupboards"
        mascotSrc="/hero.png"
        mascotAlt="Friendly drinkware"
      />
    );
  }
  return (
    <>
      <ul className="grid gap-3">
        {bids.map((bid) => {
          const unseen = isFlipRevealPending(bid);
          const rowClass = unseen
            ? "flip-unseen-pulse rounded-2xl border-2 border-[color:var(--accent)] bg-[color:var(--card)] p-3 flex gap-3 items-start cursor-pointer text-left w-full transition hover:bg-[color:var(--background)]/40"
            : "rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 flex gap-3 items-start";

          const inner = (
            <>
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#f2ead8] via-[#e8d4b8] to-[#c26b4e]/55 flex items-center justify-center shrink-0">
                {bid.item.image_url ? (
                  <Image
                    src={bid.item.image_url}
                    alt={bid.item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl" aria-hidden>
                    {bid.item.image_emoji}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight line-clamp-2">
                  {bid.item.title}
                </div>
                <div className="mono text-[11px] text-[color:var(--muted)] mt-1">
                  {bid.kind === "claim"
                    ? "Claimed"
                    : bid.kind === "flip"
                      ? unseen
                        ? "Flip settled"
                        : "Flipped"
                      : "Offered"}{" "}
                  · {formatCalendarDateUTC(bid.created_at)} · asking{" "}
                  {formatUSD(bid.item.price)}
                </div>
                {bid.kind === "flip" &&
                  bid.low_price != null &&
                  bid.high_price != null &&
                  !unseen && (
                    <div className="mono text-[11px] text-[color:var(--muted)] mt-1">
                      Flip: {formatUSD(bid.low_price)} vs{" "}
                      {formatUSD(bid.high_price)}
                    </div>
                  )}
                {unseen && (
                  <div className="mt-2 mono text-[10px] uppercase tracking-wider text-[color:var(--accent)] font-bold">
                    Result ready · tap to reveal
                  </div>
                )}
                {bid.message && !unseen && (
                  <div className="text-sm mt-1 line-clamp-2">
                    &ldquo;{bid.message}&rdquo;
                  </div>
                )}
                <Link
                  href={`/listing/${bid.item.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block mt-2 mono text-[10px] uppercase tracking-wider text-[color:var(--foreground)] underline-offset-2 hover:underline"
                >
                  View listing
                </Link>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black leading-none">
                  {unseen ? "—" : formatUSD(bid.price)}
                </div>
                <div className="mono text-[10px] uppercase text-[color:var(--muted)] mt-1 max-w-[120px] ml-auto">
                  {unseen
                    ? "flip settled"
                    : bid.status.replace(/_/g, " ")}
                </div>
              </div>
            </>
          );

          if (unseen) {
            return (
              <li key={bid.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={rowClass}
                  onClick={() => openReveal(bid)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openReveal(bid);
                    }
                  }}
                >
                  {inner}
                </div>
              </li>
            );
          }

          return (
            <li key={bid.id} className={rowClass}>
              {inner}
            </li>
          );
        })}
      </ul>

      <CoinFlipModal
        open={revealBid !== null}
        lowPrice={revealBid?.low_price ?? 0}
        highPrice={revealBid?.high_price ?? 0}
        phase={revealPhase}
        outcomeSummary={outcomeSummary}
        error={revealError || null}
        onClose={closeReveal}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition wobble-on-tap ${
        active
          ? "border-[color:var(--foreground)] text-[color:var(--foreground)]"
          : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[color:var(--background)] border-2 border-[color:var(--border)] shadow-sticker">
      {children}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-28 bg-[color:var(--card)] rounded" />
      <div className="mt-3 h-9 w-60 bg-[color:var(--card)] rounded" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-[color:var(--card)] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
