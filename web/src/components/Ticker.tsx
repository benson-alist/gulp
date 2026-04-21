import { api, formatUSD } from "@/lib/api";

/**
 * Animated marquee — a live cupboard-liquidation feed.
 *
 * Mixes the newest listings with any recorded claims/offers so the ticker
 * feels alive. Falls back to a quiet offline line when the API is down so
 * the header never blows up in dev.
 */
export default async function Ticker() {
  let entries: string[] = [];

  try {
    const [latest, offers] = await Promise.all([
      api.items({ sort: "newest", limit: 8 }, { revalidate: 15 }),
      api.offers(8, { revalidate: 15 }).catch(() => []),
    ]);

    const listingEntries = latest.map(
      (l) =>
        `${l.image_emoji} NEW · ${l.brand} ${l.title.split("—")[0].trim()} · ${formatUSD(l.price)}`,
    );

    const offerEntries = offers.map((o) =>
      o.kind === "claim"
        ? `🎉 CLAIMED · @${o.buyer_username} freed a shelf for ${formatUSD(o.price)}`
        : `💬 OFFER · @${o.buyer_username} lowballed at ${formatUSD(o.price)}`,
    );

    const roasts = [
      "🫠 You have 14 mugs. You own 2 hands.",
      "🧴 That Stanley weighs more than your pet.",
      "🗽 Karen's 'trip' was 36 hours. You paid the souvenir tax.",
      "💧 The 'hydration phase' bottle is still sealed.",
      "🎪 The 2017 conference mug is still branded.",
      "🍷 One wine glass survived. Give it a friend.",
      "🏺 The cupboard is not a trophy case.",
      "♻️ Every cup rehomed becomes someone's next confession.",
      "🔁 Buyer today, seller next winter.",
      "🛒 You came to offload a mug. You're leaving with a tumbler.",
      "🪞 The cupboard you're decluttering is the cupboard you're filling.",
    ];

    // Interleave listings, offers, and roasts for variety.
    const pool = [...listingEntries];
    offerEntries.forEach((o, i) => pool.splice(i * 2 + 1, 0, o));
    roasts.forEach((r, i) => pool.splice(i * 3 + 2, 0, r));
    entries = pool.filter(Boolean);
  } catch {
    entries = [];
  }

  if (entries.length === 0) {
    return (
      <div className="border-t border-[color:var(--border)] bg-[color:var(--foreground)] text-[color:var(--background)] text-[11px] mono uppercase tracking-wider py-1.5 text-center">
        Ticker offline · start the API for live cupboard liquidations
      </div>
    );
  }

  const doubled = [...entries, ...entries];

  return (
    <div
      aria-hidden
      className="border-t border-[color:var(--border)] bg-[color:var(--foreground)] text-[color:var(--background)] overflow-hidden"
    >
      <div className="ticker-track flex gap-8 whitespace-nowrap py-1.5 mono text-[11px] uppercase tracking-wider">
        {doubled.map((text, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>{text}</span>
            <span className="opacity-40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
