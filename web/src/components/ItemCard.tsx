import Image from "next/image";
import Link from "next/link";
import {
  DRINKWARE_LABELS,
  Item,
  SOURCE_LABELS,
  discountPct,
  formatUSD,
} from "@/lib/api";
import { RehomedStamp, StickerBadge, TapeStrip } from "@/components/illo";

/**
 * Listing card with sticker badges and tape-strip price.
 */
export default function ItemCard({ item }: { item: Item }) {
  const pct = discountPct(item.price, item.original_price);
  const displayPrice =
    item.is_sold && item.sold_price != null ? item.sold_price : item.price;
  const showAsked =
    item.is_sold &&
    item.sold_price != null &&
    Math.abs(item.sold_price - item.price) > 0.01;

  return (
    <Link
      href={`/listing/${item.id}`}
      className="sticker-peel group flex flex-col rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] overflow-hidden shadow-sticker h-full"
    >
      <div className="aspect-[5/4] bg-gradient-to-br from-[color:var(--background)] via-[#e8d4b8] to-[color:var(--accent)]/45 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <span
              className="text-6xl sm:text-7xl opacity-90"
              aria-hidden
              style={{ filter: "drop-shadow(2px 2px 0 var(--foreground))" }}
            >
              {item.image_emoji}
            </span>
          </div>
        )}
        <span className="absolute top-2 left-2 z-10">
          <StickerBadge tone="foreground">{DRINKWARE_LABELS[item.drinkware_type]}</StickerBadge>
        </span>
        {pct > 0 && (
          <span className="absolute top-2 right-2 z-10">
            <StickerBadge tone="mustard">-{pct}%</StickerBadge>
          </span>
        )}
        {item.is_sold && <RehomedStamp size="sm" />}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] mono uppercase text-[color:var(--muted)]">
          <span className="truncate">{SOURCE_LABELS[item.acquisition_source]}</span>
          <span>·</span>
          <span className="truncate">{item.years_in_cupboard}y on shelf</span>
        </div>
        <div className="font-bold leading-tight line-clamp-2 text-sm sm:text-base font-sans">
          {item.title}
        </div>
        {!item.is_sold && item.condition ? (
          <p className="text-[11px] sm:text-xs text-[color:var(--muted)] line-clamp-2 leading-snug">
            {item.condition}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            {item.is_sold ? (
              <div className="mono text-[9px] uppercase tracking-wider text-[color:var(--muted)] mb-0.5">
                Sold for
              </div>
            ) : null}
            <TapeStrip rotate={-3}>{formatUSD(displayPrice)}</TapeStrip>
            {showAsked ? (
              <div className="mono text-[10px] text-[color:var(--muted)] mt-1">
                Asked {formatUSD(item.price)}
              </div>
            ) : null}
            {item.original_price && item.original_price > item.price && (
              <div className="mono text-[11px] text-[color:var(--muted)] mt-2">
                Original price{" "}
                <span className="line-through">{formatUSD(item.original_price)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
