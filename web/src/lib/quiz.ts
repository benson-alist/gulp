import type {
  AcquisitionSource,
  DrinkwareType,
  SortKey,
} from "@/lib/api";

/**
 * Answers for the five-step “which vessel” quiz on ``/quiz``.
 */
export type QuizAnswers = {
  vibe: "cozy" | "chaos" | "minimal";
  origin: "gifted" | "impulse" | "earned";
  honesty: "low" | "medium" | "high";
  /** Sip volume energy — biases drinkware when not “regular”. */
  sip: "tank" | "thimble" | "regular";
  /** Browse tempo when honesty is medium — sort key. */
  hunt: "fresh" | "classic" | "buried";
};

/**
 * Map quiz choices to a ``/browse`` query — no API, pure routing.
 */
export function browseHrefFromQuiz(a: QuizAnswers): string {
  let drinkware_type: DrinkwareType = "mug";
  if (a.sip === "tank") {
    drinkware_type = "water_bottle";
  } else if (a.sip === "thimble") {
    drinkware_type = "shot_glass";
  } else {
    if (a.vibe === "chaos") drinkware_type = "novelty";
    else if (a.vibe === "minimal") drinkware_type = "glass";
    else drinkware_type = "mug";
  }

  let acquisition_source: AcquisitionSource | undefined;
  if (a.origin === "gifted") acquisition_source = "gift";
  if (a.origin === "impulse") acquisition_source = "impulse_buy";
  if (a.origin === "earned") acquisition_source = "conference";

  let sort: SortKey = "trending";
  if (a.honesty === "high") {
    sort = "shame_desc";
  } else if (a.honesty === "low") {
    sort = "price_asc";
  } else {
    if (a.hunt === "fresh") sort = "newest";
    else if (a.hunt === "buried") sort = "longest_shelf";
    else sort = "trending";
  }

  const p = new URLSearchParams();
  p.set("drinkware_type", drinkware_type);
  if (acquisition_source) p.set("acquisition_source", acquisition_source);
  p.set("sort", sort);
  return `/browse?${p.toString()}`;
}
