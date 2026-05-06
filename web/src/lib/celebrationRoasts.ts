/**
 * One-liner roasts for post-action celebration toasts (claim, offer, flip, list).
 * Kept separate from UI so copy can grow without bloating components.
 */

const CLAIM_ROASTS = [
  "Shelf space: reclaimed. Dignity: negotiable.",
  "Another cup escapes the cupboard industrial complex.",
  "The dishwasher thanks you for the new friend.",
  "Hydration debt: partially forgiven.",
] as const;

const OFFER_ROASTS = [
  "Lowball dispatched with dignity. Now we wait.",
  "The seller has been notified. Refresh nervously.",
  "Your offer is in the wild. May the odds be in your cupboard.",
] as const;

const FLIP_ROASTS = [
  "Fate is loading. The coin has opinions.",
  "You've straddled the price. Now the universe decides.",
  "Heads or tails — either way, you're committed.",
] as const;

const LIST_ROASTS = [
  "Your cup is officially someone else's future problem.",
  "Listed. The cupboard breathes easier.",
  "One more vessel enters the great circle.",
  "The shelf is lighter. Your soul: debatable.",
] as const;

/**
 * Return a deterministic roast from a pool using a numeric seed (e.g. item id).
 */
function pick<T extends readonly string[]>(pool: T, seed: number): string {
  const i = Math.abs(seed) % pool.length;
  return pool[i] ?? pool[0];
}

/** Roast after a successful claim at asking price. */
export function roastAfterClaim(seed: number): string {
  return pick(CLAIM_ROASTS, seed);
}

/** Roast after dispatching a below-ask offer. */
export function roastAfterOffer(seed: number): string {
  return pick(OFFER_ROASTS, seed);
}

/** Roast after proposing a coin flip. */
export function roastAfterFlipProposal(seed: number): string {
  return pick(FLIP_ROASTS, seed);
}

/** Roast right after creating a new listing (before navigation). */
export function roastAfterList(seed: number): string {
  return pick(LIST_ROASTS, seed);
}
