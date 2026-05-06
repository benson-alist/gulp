import Link from "next/link";
import { notFound } from "next/navigation";
import { api, formatUSD } from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

/**
 * Public profile page: every active listing owned by a given seller.
 *
 * Linked from the seller panel on listing detail pages so buyers can
 * browse "more from this cupboard" without filtering the main catalog.
 */
export default async function SellerPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let items;
  try {
    items = await api.sellerItems(username);
  } catch {
    notFound();
  }

  const seller = items[0]?.seller;
  const totalValue = items.reduce((sum, i) => sum + (i.is_sold ? 0 : i.price), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="t-eyebrow">
        <Link href="/browse" className="hover:underline">
          Browse
        </Link>{" "}
        / Seller
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Avatar
          displayName={seller?.display_name ?? username}
          username={username}
          avatarUrl={seller?.avatar_url ?? null}
          sizePx={64}
          className="ring-2 ring-[color:var(--border)]"
        />
        <div>
          <h1 className="t-display !text-2xl sm:!text-3xl leading-tight">
            {seller?.display_name ?? username}
            {seller?.verified && (
              <span
                aria-label="verified cupboard"
                className="text-[color:var(--success)] ml-1"
              >
                ✓
              </span>
            )}
          </h1>
          <div className="mono text-xs text-[color:var(--muted)] mt-0.5">
            @{username} · {items.length} listing{items.length === 1 ? "" : "s"} ·{" "}
            {formatUSD(totalValue)} on the shelf
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="This cupboard is empty right now."
            body="Nothing up for rehoming. The dishwasher probably won."
            ctaHref="/browse"
            ctaLabel="Browse others"
            mascotSrc="/hero.png"
            mascotAlt=""
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="h-full"
              style={{ transform: `rotate(${((item.id % 5) - 2) * 0.55}deg)` }}
            >
              <ItemCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
