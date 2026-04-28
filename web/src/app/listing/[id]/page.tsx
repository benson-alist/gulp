import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DRINKWARE_LABELS,
  SOURCE_LABELS,
  api,
  discountPct,
  formatUSD,
} from "@/lib/api";
import ShameMeter from "@/components/ShameMeter";
import ClaimPanel from "./ClaimPanel";
import { formatCalendarDateUTC } from "@/lib/formatDate";
import { RehomedStamp, StickerBadge, TapeStrip } from "@/components/illo";

export const dynamic = "force-dynamic";

/** Detail page for a single listing — flea-market-style, one asking price. */
export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let item;
  try {
    item = await api.item(id);
  } catch {
    notFound();
  }

  const related = await api
    .items({ drinkware_type: item.drinkware_type, limit: 8 })
    .then((items) => items.filter((i) => i.id !== item.id).slice(0, 4))
    .catch(() => []);

  const pct = discountPct(item.price, item.original_price);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
        <Link href="/browse" className="hover:underline">
          Browse
        </Link>{" "}
        /{" "}
        <Link
          href={`/browse?drinkware_type=${item.drinkware_type}`}
          className="hover:underline"
        >
          {DRINKWARE_LABELS[item.drinkware_type]}
        </Link>
      </div>

      <div className="mt-4 grid md:grid-cols-[1.05fr_1fr] gap-6 md:gap-10">
        {/* LEFT: hero + spec list + seller */}
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-[color:var(--foreground)] bg-gradient-to-br from-[color:var(--background)] via-[#e8d4b8] to-[color:var(--accent)]/50 aspect-square flex items-center justify-center relative overflow-hidden shadow-sticker">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
                priority
              />
            ) : (
              <span
                className="text-[10rem] sm:text-[14rem] leading-none"
                aria-hidden
              >
                {item.image_emoji}
              </span>
            )}
            <span className="absolute top-4 left-4 z-10">
              <StickerBadge tone="foreground">
                {DRINKWARE_LABELS[item.drinkware_type]} · {item.size_oz}oz
              </StickerBadge>
            </span>
            <span className="absolute top-4 right-4 z-10">
              <StickerBadge tone="sky">{item.years_in_cupboard}y on shelf</StickerBadge>
            </span>
            {item.is_sold && <RehomedStamp size="lg" />}
          </div>

          <div className="rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sticker">
            <div className="mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
              The forensics
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <SpecRow label="Brand" value={item.brand} />
              <SpecRow label="Type" value={DRINKWARE_LABELS[item.drinkware_type]} />
              <SpecRow label="Size" value={`${item.size_oz} oz`} />
              <SpecRow label="Material" value={item.material} />
              <SpecRow label="Colorway" value={item.colorway || "—"} />
              <SpecRow label="Condition" value={item.condition} />
              <SpecRow
                label="Origin"
                value={SOURCE_LABELS[item.acquisition_source]}
              />
              <SpecRow
                label="Shelf time"
                value={`${item.years_in_cupboard} years`}
              />
            </dl>
          </div>

          <Link
            href={`/u/${item.seller.username}`}
            className="sticker-peel rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card)] p-5 flex items-center gap-4 shadow-sticker"
          >
            <div className="w-12 h-12 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] flex items-center justify-center font-black">
              {item.seller.display_name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">
                {item.seller.display_name}{" "}
                {item.seller.verified && (
                  <span
                    aria-label="verified cupboard"
                    title="Verified"
                    className="text-[color:var(--success)]"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="mono text-[11px] text-[color:var(--muted)]">
                @{item.seller.username} · listing since{" "}
                {formatCalendarDateUTC(item.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="mono text-[10px] uppercase text-[color:var(--muted)]">
                Character
              </div>
              <div className="font-black">{item.shame_index}/10</div>
            </div>
          </Link>
        </div>

        {/* RIGHT: title, price, claim panel */}
        <div>
          <div className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
            {item.brand} · {item.colorway || item.material}
          </div>
          <h1 className="mt-2 t-display">{item.title}</h1>

          <div className="mt-5 flex items-end flex-wrap gap-x-4 gap-y-2">
            <TapeStrip
              rotate={-2}
              className="!text-3xl sm:!text-4xl !px-4 !py-2 !font-black"
            >
              {formatUSD(item.price)}
            </TapeStrip>
            {item.original_price && item.original_price > item.price && (
              <div className="flex flex-col mono text-xs">
                <span className="line-through text-[color:var(--muted)]">
                  paid {formatUSD(item.original_price)}
                </span>
                <span className="text-[color:var(--accent)] font-bold uppercase tracking-wider">
                  {pct}% off
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge accent>{SOURCE_LABELS[item.acquisition_source]}</Badge>
            <Badge>{item.condition}</Badge>
            <Badge>
              @{item.seller.username}
              {item.seller.verified ? " ✓" : ""}
            </Badge>
          </div>

          <div className="mt-5">
            <ShameMeter value={item.shame_index} />
          </div>

          <div className="mt-6">
            <ClaimPanel
              itemId={item.id}
              price={item.price}
              sold={item.is_sold}
              sellerId={item.seller.id}
            />
          </div>

          <div className="mt-6 border-t border-[color:var(--border)] pt-5">
            <div className="mono text-[11px] uppercase text-[color:var(--muted)]">
              The Gulp cupboard promise
            </div>
            <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
              <li>· No authentication theatre — a cup is a cup is a cup.</li>
              <li>· Dishwasher scars disclosed in writing, notarised in vibes.</li>
              <li>· Sticker residue surveyed under UV, never under judgment.</li>
              <li>· Plays well with whatever&apos;s already on your shelf.</li>
              <li>
                · When it&apos;s time for its next adventure, we&apos;ll be
                here.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              More {DRINKWARE_LABELS[item.drinkware_type]}s looking for homes
            </h2>
            <Link
              href={`/browse?drinkware_type=${item.drinkware_type}`}
              className="mono text-xs uppercase hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {related.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="sticker-peel rounded-xl border-2 border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden flex flex-col shadow-sticker"
              >
                <div className="aspect-[5/4] relative bg-gradient-to-br from-[#f2ead8] via-[#e8d4b8] to-[#c26b4e]/55 flex items-center justify-center">
                  {l.image_url ? (
                    <Image
                      src={l.image_url}
                      alt={l.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-4xl" aria-hidden>
                      {l.image_emoji}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col items-start">
                  <div className="text-sm font-semibold line-clamp-2">
                    {l.title}
                  </div>
                  <div className="mt-1 mono text-xs text-[color:var(--muted)]">
                    {formatUSD(l.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Pill-shaped metadata chip; `accent` variant uses the brand orange. */
function Badge({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs mono uppercase border-2 shadow-sticker font-bold ${
        accent
          ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)] border-[color:var(--foreground)]"
          : "border-[color:var(--border)] bg-[color:var(--card)]"
      }`}
    >
      {children}
    </span>
  );
}

/** A single row in the specs dl. */
function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="mono text-[10px] uppercase text-[color:var(--muted)] tracking-wider self-center">
        {label}
      </dt>
      <dd className="font-semibold truncate">{value}</dd>
    </>
  );
}
