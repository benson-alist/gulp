import type { DrinkwareType } from "./api";

/** Public path under `web/public/products`. */
const p = (filename: string) => `/products/${filename}`;

/**
 * Curated stock photos per drinkware type (filenames in `web/public/products/`).
 * Use `stockImagesForType` for a list that always includes at least the category image.
 */
const BY_TYPE: Record<DrinkwareType, string[]> = {
  mug: [
    p("item_01_worlds_best_dad_mug.png"),
    p("item_02_devcon_2017_mug.png"),
    p("item_03_tokyo_starbucks_mug.png"),
    p("item_24_speckled_mug.png"),
    p("item_27_okayest_boss_mug.png"),
    p("item_30_law_firm_mug.png"),
  ],
  water_bottle: [
    p("item_06_stanley_valentines_riot.png"),
    p("item_07_hydroflask_sticker_residue.png"),
    p("item_08_owala_freesip.png"),
    p("item_09_nalgene_college.png"),
    p("item_10_yeti_rambler.png"),
    p("item_11_stojo_collapsible.png"),
    p("item_23_emotional_support_bottle.png"),
  ],
  shot_glass: [
    p("item_12_iloveny_shot_glass.png"),
    p("item_13_hardrock_prague_shot_glass.png"),
    p("item_14_vegas_shot_glass.png"),
    p("item_15_pisa_shot_glass.png"),
  ],
  pint_glass: [
    p("item_16_mismatched_pint_glasses.png"),
    p("item_17_hazy_ipa_pint.png"),
    p("item_42_wedding_favor_pint.png"),
  ],
  wine_glass: [
    p("item_18_surviving_wine_glass.png"),
    p("item_19_champagne_flutes.png"),
    p("item_20_oversized_wine_glass.png"),
    p("item_38_rose_all_day_stemless.png"),
    p("item_39_gala_wine_glass.png"),
    p("item_40_napa_tasting_wine_glass.png"),
    p("item_41_ribbed_wine_glass.png"),
  ],
  glass: [
    p("item_28_highball_glasses_set.png"),
    p("item_34_wedding_registry_highball.png"),
    p("item_35_rippled_stacking_glasses.png"),
    p("item_36_sales_kickoff_rocks_glass.png"),
    p("item_37_cut_crystal_rocks_glass.png"),
  ],
  travel_mug: [
    p("item_21_contigo_travel_mug.png"),
    p("item_31_uncle_rays_thermos.png"),
  ],
  tumbler: [p("item_05_oops_ceramic_tumbler.png"), p("item_22_promo_bank_tumbler.png")],
  novelty: [
    p("item_04_mustache_mug.png"),
    p("item_25_live_laugh_love_mug.png"),
    p("item_29_sorcerer_mickey_mug.png"),
    p("item_32_dubai_chocolate_viral_mug.png"),
    p("item_33_gingerbread_mug_in_july.png"),
    p("item_26_venice_espresso_cup.png"),
  ],
};

/** Stock image URLs for a drinkware type, never empty (category placeholder fallback). */
export function stockImagesForType(t: DrinkwareType): string[] {
  const list = BY_TYPE[t];
  if (list.length > 0) return list;
  return [`/categories/${t}.png`];
}

export const STOCK_IMAGES_BY_TYPE = BY_TYPE;
