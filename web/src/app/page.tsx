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
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[color:var(--border)]">
        <div className="grain absolute inset-0 opacity-40 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 md:pt-20 pb-6 md:pb-8 relative">
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
            <div>
              <div className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Gulp · a circular economy for drinkware
              </div>
              <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight">
                The marketplace
                <br />
                <span className="bg-[color:var(--accent)] text-[color:var(--accent-ink)] px-2 -mx-2 inline-block rotate-[-1deg]">
                  for one too many.
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[color:var(--muted)] max-w-xl">
                A little flea market for the mugs, bottles, shot glasses, and
                oversized wine glasses looking for a new cupboard. Name a
                price. Find a match. Every cup deserves a second pour.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/browse"
                  className="bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-3 rounded-full font-semibold hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition"
                >
                  Adopt a cup
                </Link>
                <Link
                  href="/sell"
                  className="border border-[color:var(--foreground)] px-5 py-3 rounded-full font-semibold hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition"
                >
                  Rehome yours
                </Link>
              </div>
            </div>

            {/* HERO ILLUSTRATION */}
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-72 h-72 rounded-full bg-[color:var(--accent)]/30 blur-2xl hidden md:block" />
              <div className="relative max-w-md mx-auto md:max-w-none">
                <Image
                  src="/hero.png"
                  alt="A group of cute mismatched drinkware characters huddled together on a shelf"
                  width={1024}
                  height={1024}
                  priority
                  sizes="(min-width: 768px) 520px, 100vw"
                  className="w-full h-auto select-none"
                />
              </div>
            </div>
          </div>

          {/* CIRCULATION STRIP — live stats dashboard */}
          <div className="mt-10 md:mt-14 rounded-3xl border border-[color:var(--foreground)] bg-[color:var(--card)] p-5 sm:p-6 shadow-[6px_6px_0_0_var(--foreground)]">
            <div className="flex items-center justify-between mono text-[10px] uppercase tracking-widest">
              <span className="text-[color:var(--muted)]">
                Cupboard circulation index
              </span>
              <span className="text-[color:var(--accent)]">LIVE</span>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="mono text-[10px] uppercase text-[color:var(--muted)] tracking-widest">
                  Value in circulation
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black">
                  {formatUSD(stats.value_liberated_usd)}
                </div>
                <div className="mono text-[10px] text-[color:var(--muted)] mt-1">
                  Same cups. New cupboards. Fresh pours.
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 sm:gap-10">
                <Stat label="Cups in play" value={String(stats.total_items)} />
                <Stat
                  label="Lowballs lobbed"
                  value={String(stats.total_offers)}
                />
                <Stat
                  label="Cupboard-years freed"
                  value={String(stats.cupboard_years_liberated)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DRINKWARE TYPE CHIPS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader
          eyebrow="Shop by drinkware"
          title="Mugs, bottles, and every vessel in between."
        />
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
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
                className="card-hover rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 pt-2 flex flex-col items-center text-center gap-1 min-h-[140px] justify-between"
              >
                <div className="relative w-20 h-20 shrink-0" aria-hidden>
                  <Image
                    src={`/categories/${t}.png`}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold leading-tight">
                  {DRINKWARE_LABELS[t]}
                </span>
                <span className="mono text-[10px] text-[color:var(--muted)]">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ACQUISITION SOURCE CHIPS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <SectionHeader
          eyebrow="Shop by how it got there"
          title="Every cup has a backstory."
        />
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {sources.map((s) => (
            <Link
              key={s}
              href={`/browse?acquisition_source=${s}`}
              className="shrink-0 card-hover rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm font-semibold"
            >
              {SOURCE_LABELS[s]}
            </Link>
          ))}
        </div>
      </section>

      {/* FRESHLY LISTED */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Freshly listed"
            title="Just off the shelf."
          />
          <Link
            href="/browse?sort=newest"
            className="mono text-xs uppercase tracking-wider hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {freshest.map((l) => (
            <ItemCard key={l.id} item={l} />
          ))}
        </div>
      </section>

      {/* LONG-TIME SHELF RESIDENTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Long-time shelf residents"
            title="Been around the cupboard."
          />
          <Link
            href="/browse?sort=longest_shelf"
            className="mono text-xs uppercase tracking-wider hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {longest.slice(0, 6).map((l) => (
            <ItemCard key={l.id} item={l} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps, two cupboards, one happy handoff."
        />
        <div className="mt-6 grid md:grid-cols-3 gap-3 sm:gap-4">
          <HowCard
            num="01"
            title="List it"
            image="/how/list.png"
            body="Tell us what it is, how long it's been on your shelf, and what kind of character it has (1–10). Pick a vibe emoji. We won't ask for photos — a cup is a cup."
          />
          <HowCard
            num="02"
            title="Name one price"
            image="/how/price.png"
            body="Set what you want for it. Add what you paid for a tasteful old-price strikethrough — a good story sells a mug faster than any photo could."
          />
          <HowCard
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

/** Small labeled stat shown inside the hero card. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase text-[color:var(--muted)] tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

/** Eyebrow + big title pair used across sections. */
function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
        {title}
      </h2>
    </div>
  );
}

/** Numbered explanation card for the "How it works" section. */
function HowCard({
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
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 sm:p-6 flex gap-4">
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[color:var(--background)] border border-[color:var(--border)]">
        <Image
          src={image}
          alt=""
          fill
          sizes="80px"
          className="object-contain"
        />
      </div>
      <div className="min-w-0">
        <div className="mono text-sm text-[color:var(--muted)]">{num}</div>
        <div className="mt-1 text-xl font-black">{title}</div>
        <div className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}
