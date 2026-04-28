import Link from "next/link";
import Image from "next/image";
import {
  DRINKWARE_LABELS,
  DrinkwareType,
  SOURCE_LABELS,
  AcquisitionSource,
  api,
  formatUSD,
} from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import Stat from "@/components/Stat";
import ParallaxVars from "@/components/ParallaxVars";
import {
  DividerScribble,
  DividerWavy,
  ScribbleArrow,
  SparkleBurst,
  StickerBadge,
} from "@/components/illo";

export const dynamic = "force-dynamic";

/** Fetch a value, returning `fallback` on any error (so the home page never 500s). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [stats, freshest, longest, types] = await Promise.all([
    safe(() => api.stats(), {
      total_items: 0,
      cupboard_years_liberated: 0,
      average_shame: 0,
      total_offers: 0,
      value_liberated_usd: 0,
    }),
    safe(() => api.items({ sort: "newest", limit: 8 }), []),
    safe(() => api.items({ sort: "longest_shelf", limit: 6 }), []),
    safe(() => api.types(), []),
  ]);

  const sources: AcquisitionSource[] = [
    "trend",
    "souvenir",
    "conference",
    "gift",
    "inherited",
    "impulse_buy",
  ];

  return (
    <div>
      <ParallaxVars>
        <section className="relative overflow-hidden">
          <div className="grain absolute inset-0 opacity-35 pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-4 md:pb-6 relative">
            <div className="grid md:grid-cols-[1.05fr_1fr] gap-8 md:gap-10 items-center">
              <div className="relative z-10 parallax-stick">
                <div className="t-eyebrow">Gulp · a circular economy for drinkware</div>
                <h1 className="mt-3 t-hero">
                  The marketplace
                  <br />
                  <span className="relative inline-block">
                    <span className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] px-2 -mx-1 inline-block -rotate-1 shadow-sticker border-2 border-[color:var(--foreground)]">
                      for one too many.
                    </span>
                    <span className="absolute -right-6 -top-4 hidden sm:block text-[color:var(--ink-mustard)]">
                      <SparkleBurst className="w-7 h-7" />
                    </span>
                  </span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-[color:var(--muted)] max-w-xl font-medium">
                  A little flea market for the mugs, bottles, shot glasses, and
                  oversized wine glasses looking for a new cupboard. Name a
                  price. Find a match. Every cup deserves a second pour.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/browse"
                    className="inline-flex min-h-[48px] items-center px-6 py-3 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] font-semibold border-2 border-[color:var(--foreground)] shadow-sticker hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition wobble-on-tap -rotate-1 hover:rotate-0"
                  >
                    Adopt a cup
                  </Link>
                  <Link
                    href="/sell"
                    className="inline-flex min-h-[48px] items-center px-6 py-3 rounded-full border-2 border-[color:var(--foreground)] font-semibold hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition sticker-peel bg-[color:var(--card)]"
                  >
                    Rehome yours
                  </Link>
                </div>
              </div>

              <div className="relative flex justify-center md:justify-end">
                <div className="absolute -top-4 -left-4 w-64 h-64 rounded-full bg-[color:var(--accent)]/25 blur-3xl hidden md:block parallax-stick" />
                <div className="relative max-w-[min(100%,420px)] bob">
                  <Image
                    src="/hero.png"
                    alt="A group of cute mismatched drinkware characters huddled together on a shelf"
                    width={1024}
                    height={1024}
                    priority
                    sizes="(min-width: 768px) 420px, 100vw"
                    className="w-full h-auto select-none drop-shadow-[6px_8px_0_var(--foreground)]"
                  />
                </div>
              </div>
            </div>

            {/* Card uses the standard rounded + sticker-shadow idiom rather than
                .torn-paper, because clip-path was hiding the box-shadow and
                cropping the bottom row of small captions on narrow viewports. */}
            <div className="mt-10 md:mt-12 rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-5 sm:p-7 shadow-sticker relative">
              <div className="flex items-center justify-between gap-3 mono text-[10px] uppercase tracking-widest">
                <span className="text-[color:var(--muted)]">Cupboard circulation index</span>
                <StickerBadge tone="plum">Live</StickerBadge>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <Stat
                    label="Value in circulation"
                    value={
                      <span className="text-3xl sm:text-4xl md:text-5xl">
                        {formatUSD(stats.value_liberated_usd)}
                      </span>
                    }
                    hint="Same cups. New cupboards. Fresh pours."
                  />
                </div>
                <div className="grid grid-cols-3 gap-6 sm:gap-10">
                  <Stat label="Cups in play" value={String(stats.total_items)} />
                  <Stat label="Lowballs lobbed" value={String(stats.total_offers)} />
                  <Stat
                    label="Cupboard-years freed"
                    value={String(stats.cupboard_years_liberated)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DividerWavy />
        </section>
      </ParallaxVars>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <SectionHeader
          eyebrow="Shop by drinkware"
          title="Mugs, bottles, and every vessel in between."
        />
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {(
            [
              "mug",
              "water_bottle",
              "shot_glass",
              "wine_glass",
              "pint_glass",
              "glass",
              "travel_mug",
              "tumbler",
              "novelty",
            ] as DrinkwareType[]
          ).map((t) => {
            const count = types.find((x) => x.drinkware_type === t)?.count ?? 0;
            return (
              <Link
                key={t}
                href={`/browse?drinkware_type=${t}`}
                className="sticker-peel rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card)] p-2 pt-2 flex flex-col items-center text-center gap-1 min-h-[132px] justify-between shadow-sticker hover:border-[color:var(--foreground)]"
              >
                <div className="relative w-[4.5rem] h-[4.5rem] shrink-0" aria-hidden>
                  <Image
                    src={`/categories/${t}.png`}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold leading-tight font-sans">
                  {DRINKWARE_LABELS[t]}
                </span>
                <span className="mono text-[10px] text-[color:var(--muted)]">{count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <DividerScribble />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <SectionHeader eyebrow="Shop by how it got there" title="Every cup has a backstory." />
        <div className="mt-5 -my-1 py-2 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {sources.map((s) => (
            <Link
              key={s}
              href={`/browse?acquisition_source=${s}`}
              className="shrink-0 sticker-peel rounded-full border-2 border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm font-semibold shadow-sticker hover:border-[color:var(--foreground)]"
            >
              {SOURCE_LABELS[s]}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader scribble={false} eyebrow="Freshly listed" title="Just off the shelf." />
          <Link
            href="/browse?sort=newest"
            className="mono text-xs uppercase tracking-wider hover:underline pb-1"
          >
            View all →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {freshest.map((l) => (
            <div
              key={l.id}
              className="h-full"
              style={{ transform: `rotate(${((l.id % 5) - 2) * 0.55}deg)` }}
            >
              <ItemCard item={l} />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            scribble={false}
            eyebrow="Long-time shelf residents"
            title="Been around the cupboard."
          />
          <Link
            href="/browse?sort=longest_shelf"
            className="mono text-xs uppercase tracking-wider hover:underline pb-1"
          >
            View all →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {longest.slice(0, 6).map((l) => (
            <div
              key={l.id}
              className="h-full"
              style={{ transform: `rotate(${((l.id % 5) - 2) * 0.55}deg)` }}
            >
              <ItemCard item={l} />
            </div>
          ))}
        </div>
      </section>

      <DividerScribble />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps, two cupboards, one happy handoff."
        />
        <div className="mt-8 flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-4">
          <HowShelfCard
            num="01"
            title="List it"
            image="/how/list.png"
            body="Tell us what it is, how long it's been on your shelf, and what kind of character it has (1–10). Pick a vibe emoji. We won't ask for photos — a cup is a cup."
          />
          <div className="hidden lg:flex items-center justify-center text-[color:var(--accent)] shrink-0 w-14">
            <ScribbleArrow className="w-12 h-8" />
          </div>
          <HowShelfCard
            num="02"
            title="Name one price"
            image="/how/price.png"
            body="Set what you want for it. Add what you paid for a tasteful old-price strikethrough — a good story sells a mug faster than any photo could."
          />
          <div className="hidden lg:flex items-center justify-center text-[color:var(--accent)] shrink-0 w-14">
            <ScribbleArrow className="w-12 h-8" />
          </div>
          <HowShelfCard
            num="03"
            title="Hand it off"
            image="/how/handoff.png"
            body="A stranger claims it at asking, or lobs a lowball with a polite note. You say yes. Their cupboard gets a new character, your shelf gets a little air. Everybody pours."
          />
        </div>
      </section>
    </div>
  );
}

/** Numbered “how it works” card with illustration — shelf-scene row on large screens. */
function HowShelfCard({
  num,
  title,
  body,
  image,
}: {
  num: string;
  title: string;
  body: string;
  image: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-5 sm:p-6 flex gap-4 shadow-sticker sticker-peel -rotate-1 hover:rotate-0 transition-transform">
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[color:var(--background)] border-2 border-[color:var(--border)]">
        <Image src={image} alt="" fill sizes="80px" className="object-contain" />
      </div>
      <div className="min-w-0">
        <div className="mono text-sm text-[color:var(--muted)]">{num}</div>
        <div className="mt-1 text-xl font-black font-sans">{title}</div>
        <div className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
