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
import { RehomedStamp, StickerBadge, TapeStrip } from "@/components/illo";

/**
 * Listing card with sticker badges, tape-strip price, and peel hover.
 */
export default function ItemCard({ item }: { item: Item }) {
  const pct = discountPct(item.price, item.original_price);
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
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <TapeStrip rotate={-3}>{formatUSD(item.price)}</TapeStrip>
            {item.original_price && item.original_price > item.price && (
              <div className="mono text-[11px] text-[color:var(--muted)] mt-2">
                paid{" "}
                <span className="line-through">{formatUSD(item.original_price)}</span>
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
