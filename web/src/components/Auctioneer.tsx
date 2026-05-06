"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUSD } from "@/lib/api";

type Props = {
  title: string;
  brand: string;
  drinkwareLabel: string;
  price: number;
  yearsOnShelf: number;
};

/**
 * Decorative typewriter line: rotating flea-market “auctioneer” patter built
 * from the listing fields. ``aria-live="off"`` — purely visual flair.
 */
export default function Auctioneer({
  title,
  brand,
  drinkwareLabel,
  price,
  yearsOnShelf,
}: Props) {
  const lines = useMemo(
    () =>
      buildLines({ title, brand, drinkwareLabel, price, yearsOnShelf }),
    [title, brand, drinkwareLabel, price, yearsOnShelf],
  );
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  const full = lines[lineIdx] ?? "";

  useEffect(() => {
    if (charIdx < full.length) {
      const t = window.setTimeout(() => setCharIdx((c) => c + 1), 28);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setLineIdx((i) => (i + 1) % lines.length);
      setCharIdx(0);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [charIdx, full.length, lines.length]);

  const shown = full.slice(0, charIdx);

  return (
    <p
      className="mt-2 text-sm text-[color:var(--muted)] font-medium italic max-w-xl min-h-[3lh]"
      aria-live="off"
    >
      <span className="text-[color:var(--ink-mustard)] mr-1" aria-hidden>
        ★
      </span>
      {shown}
      <span className="inline-block w-0.5 h-4 ml-0.5 bg-[color:var(--accent)] align-middle animate-pulse" />
    </p>
  );
}

function buildLines(p: Props): string[] {
  const shortTitle = p.title.split("—")[0]?.trim() || p.title;
  const priceStr = formatUSD(p.price);
  return [
    `Do I hear ${priceStr}? ${priceStr} for this ${p.drinkwareLabel.toLowerCase()} — "${shortTitle.slice(0, 48)}${shortTitle.length > 48 ? "…" : ""}"?`,
    `${p.brand} says hello from the shelf. ${p.yearsOnShelf} year${p.yearsOnShelf === 1 ? "" : "s"} of cupboard real estate, yours for ${priceStr}.`,
    `Going once on the hydration regret. Going twice. Somebody give this ${p.drinkwareLabel.toLowerCase()} a new dishwasher cycle.`,
    `The crowd goes mild! A ${p.drinkwareLabel.toLowerCase()} with stories — opening bid is the whole ${priceStr}, no haggling with your conscience.`,
  ];
}
