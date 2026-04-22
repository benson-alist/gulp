import Image from "next/image";
import Link from "next/link";
import {
  DRINKWARE_LABELS,
  Item,
  SOURCE_LABELS,
  discountPct,
  formatUSD,
} from "@/lib/api";
import ShameMeter from "./ShameMeter";

/**
 * Classified-ad style listing card.
 *
 * Built for a flea-market feeling rather than a sneaker marketplace — a
 * single price, an optional "paid" strikethrough for the discount roast,
 * and the seller's handle to humanize the sale.
 */
export default function ItemCard({ item }: { item: Item }) {
  const pct = discountPct(item.price, item.original_price);
  return (
    <Link
      href={`/listing/${item.id}`}
      className="card-hover group flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden"
    >
      <div className="aspect-[5/4] bg-gradient-to-br from-[#f2ead8] via-[#e8d4b8] to-[#c26b4e]/55 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span className="text-6xl sm:text-7xl" aria-hidden>
            {item.image_emoji}
          </span>
        )}
        <span className="absolute top-2 left-2 mono text-[10px] uppercase tracking-wider bg-white/95 px-2 py-1 rounded-full">
          {DRINKWARE_LABELS[item.drinkware_type]}
        </span>
        {pct > 0 && (
          <span className="absolute top-2 right-2 mono text-[10px] uppercase tracking-wider bg-[color:var(--accent)] text-[color:var(--accent-ink)] px-2 py-1 rounded-full font-bold">
            -{pct}%
          </span>
        )}
        {item.is_sold && (
          <span className="absolute inset-0 flex items-center justify-center bg-[color:var(--foreground)]/80 text-[color:var(--background)] mono uppercase tracking-widest text-sm">
            Rehomed
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] mono uppercase text-[color:var(--muted)]">
          <span className="truncate">{SOURCE_LABELS[item.acquisition_source]}</span>
          <span>·</span>
          <span className="truncate">{item.years_in_cupboard}y on shelf</span>
        </div>
        <div className="font-bold leading-tight line-clamp-2 text-sm sm:text-base">
          {item.title}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-xl sm:text-2xl font-black leading-none">
              {formatUSD(item.price)}
            </div>
            {item.original_price && item.original_price > item.price && (
              <div className="mono text-[11px] text-[color:var(--muted)] mt-1">
                paid{" "}
                <span className="line-through">
                  {formatUSD(item.original_price)}
                </span>
              </div>
            )}
          </div>
          <div className="w-24">
            <ShameMeter value={item.shame_index} compact />
          </div>
        </div>
      </div>
    </Link>
  );
}
