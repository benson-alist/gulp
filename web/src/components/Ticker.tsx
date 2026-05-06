import { api, formatUSD } from "@/lib/api";
import TickerTrack from "@/components/TickerTrack";

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

    const offerEntries = offers.map((o) => {
      if (o.kind === "claim") {
        return `🎉 CLAIMED · @${o.buyer.username} liberated a shelf for ${formatUSD(o.price)}`;
      }
      if (o.kind === "flip") {
        if (o.status === "flipped_won") {
          return `🪙 FLIP WIN · @${o.buyer.username} walked away paying ${formatUSD(o.price)}`;
        }
        if (o.status === "flipped_lost") {
          return `🪙 FLIP LOSS · @${o.buyer.username} owes ${formatUSD(o.price)} and their dignity`;
        }
        return `🪙 FLIP · @${o.buyer.username} dared a seller to flip a coin`;
      }
      return `💬 OFFER · @${o.buyer.username} lowballed politely at ${formatUSD(o.price)}`;
    });

    const roasts = [
      "🫠 You have 14 mugs. You own 2 hands.",
      "🧴 That Stanley outweighs your pet. Your pet has noticed.",
      "🗽 Karen's 'trip' was 36 hours. You paid the full souvenir tax.",
      "💧 The 'hydration phase' bottle is still factory sealed.",
      "🎪 The 2017 conference mug is still branded. The company is not.",
      "🍷 One wine glass survived the move. Give it a friend.",
      "🏺 The cupboard is not a trophy case. Except it is. Yours.",
      "♻️ Every cup rehomed buys you about 4 inches of cupboard air.",
      "🔁 Buyer today, seller next winter. Circle unbroken.",
      "🛒 You came to offload a mug. You're leaving with a tumbler.",
      "🪞 The cupboard you're decluttering is the cupboard you're filling.",
      "🥴 You do not need a 64oz bottle. You sit at a desk.",
      "🎁 It was a gift. It is now, legally, your problem.",
      "☕ The mug you drink from is always in the dishwasher. Always.",
      "📏 Cupboard depth: 12\". Cupboard ambition: 36\".",
      "🧊 You bought it to keep ice cold. The ice is older than your niece.",
      "🪩 Sticker residue is not a personality trait.",
      "🎓 That grad-school water bottle has a PhD in dust.",
      "💍 Wedding flutes: still sealed since 2019. Love lasts. Bubbly doesn't.",
      "🧽 Hand-wash only. You have never once hand-washed it.",
      "🕳️ One cup in, one cup out. Hoarders hate this one trick.",
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
        Ticker offline · the cupboard is quiet · start the API to resume the roast
      </div>
    );
  }

  const doubled = [...entries, ...entries];

  return <TickerTrack items={doubled} />;
}
