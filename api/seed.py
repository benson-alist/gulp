"""Seed Gulp with a glorious gallery of drinkware regret.

Idempotent: if any items already exist, the script exits without changes.
Run with: ``python seed.py`` from inside the activated API virtualenv.

Schema is v2 — each listing has a single asking `price` and, where it
sharpens the roast, an `original_price` ("what the seller paid").
"""
from __future__ import annotations

import logging
from decimal import Decimal

from app import models
from app.db import SessionLocal


logger = logging.getLogger("gulp.seed")


def _dec(value) -> Decimal:
    """Coerce numeric-ish values into a 2dp `Decimal` for currency columns."""
    return Decimal(str(value)).quantize(Decimal("0.01"))


SELLERS: list[tuple[str, str, bool]] = [
    ("dad_of_four", "Dad of Four (ranked 14th)", True),
    ("trendy_tessa", "Trendy Tessa", True),
    ("karen_abroad", "Karen Abroad", False),
    ("brewery_bill", "Brewery Bill", True),
    ("office_swag_pile", "Office Swag Pile", False),
    ("hydration_stan", "Hydration Stan", True),
    ("grandma_s_estate", "Grandma's Estate", True),
    ("impulse_ian", "Impulse Ian", False),
    ("wine_mom_wendy", "Wine Mom Wendy", True),
    ("ceramics_major", "Ceramics Major", False),
]


# (title, brand, drinkware_type, acquisition_source, size_oz, material,
#  colorway, condition, shame_index, years_in_cupboard, emoji,
#  price, original_price, seller_idx, image_url)
#
# `image_url` points at an illustration served from `web/public/products/`.
# Keep this list in the same order the images were generated so each row
# lines up with the matching asset (item_01_ → row 0, item_02_ → row 1, …).
LISTINGS: list[tuple] = [
    ("World's Best Dad Mug — ranked 14th that year",
     "Hallmarko", "mug", "gift", 12, "ceramic",
     "White w/ faded letters", "Used — survived four lunchboxes",
     8, 16, "👨", 9, 18, 0,
     "/products/item_01_worlds_best_dad_mug.png"),
    ("Free Conference 2017 Mug — still branded",
     "DevCon", "mug", "conference", 10, "ceramic",
     "Slate grey", "New — never held a beverage",
     9, 8, "🧑‍💻", 4, None, 4,
     "/products/item_02_devcon_2017_mug.png"),
    ("Starbucks 'You Are Here' Tokyo — city I visited once",
     "Starbuccos", "mug", "souvenir", 14, "ceramic",
     "Cherry blossom pink", "Used — shelf display only",
     7, 6, "🌸", 18, 24, 2,
     "/products/item_03_tokyo_starbucks_mug.png"),
    ("Mustache Mug — ironic in 2014, now just a mug",
     "HandlebarCo", "novelty", "impulse_buy", 12, "ceramic",
     "Ivory", "Used — slightly chipped lip",
     9, 12, "👨‍🦰", 6, 22, 7,
     "/products/item_04_mustache_mug.png"),
    ("Hand-thrown 'Oops' Ceramic Tumbler",
     "Etsi Studio", "tumbler", "impulse_buy", 10, "ceramic",
     "Speckled moss", "New — studio blemish",
     6, 3, "🏺", 14, 48, 9,
     "/products/item_05_oops_ceramic_tumbler.png"),
    ("Stanley Quencher — 'Valentine's Day Riot' Colorway",
     "Stanleigh", "water_bottle", "trend", 40, "stainless steel",
     "Rose Quartz", "Used — one stampede",
     10, 2, "🧴", 28, 55, 1,
     "/products/item_06_stanley_valentines_riot.png"),
    ("Hydro Flask 32oz — sticker residue included",
     "Hydrate Flasque", "water_bottle", "trend", 32, "stainless steel",
     "Pacific Blue", "Used — peeled-sticker chic",
     7, 7, "🧴", 16, 49, 5,
     "/products/item_07_hydroflask_sticker_residue.png"),
    ("Owala FreeSip — bought during hydration phase",
     "Owala-ala", "water_bottle", "trend", 24, "stainless steel",
     "Sleepy Sage", "New — used twice",
     6, 1, "🥤", 18, 36, 1,
     "/products/item_08_owala_freesip.png"),
    ("Nalgene 32oz — college leftover",
     "Nalgenie", "water_bottle", "impulse_buy", 32, "plastic",
     "Translucent Slate", "Used — carabiner scuffed",
     5, 11, "🧴", 6, 20, 5,
     "/products/item_09_nalgene_college.png"),
    ("Yeti Rambler — heavier than my feelings",
     "Yeti-er", "water_bottle", "impulse_buy", 26, "stainless steel",
     "Charcoal", "Used — one dent of character",
     6, 4, "🥶", 22, 42, 7,
     "/products/item_10_yeti_rambler.png"),
    ("Stojo Collapsible — never actually collapsed",
     "Stoh-joh", "water_bottle", "trend", 16, "silicone",
     "Lemon", "New — wrapper still on",
     8, 3, "🍋", 8, 25, 7,
     "/products/item_11_stojo_collapsible.png"),
    ("I ❤️ NY Shot Glass — from Karen's 36-hour trip",
     "Touristo", "shot_glass", "souvenir", 1.5, "glass",
     "Classic red", "New — displayed, never shot",
     9, 8, "🗽", 2, None, 2,
     "/products/item_12_iloveny_shot_glass.png"),
    ("Hard Rock Cafe Prague — 2008",
     "Hard Cafe", "shot_glass", "souvenir", 1.5, "glass",
     "Burgundy", "Used — gathered significant dust",
     8, 16, "🎸", 3, None, 2,
     "/products/item_13_hardrock_prague_shot_glass.png"),
    ("Vegas 'What Happens Here' Shot Glass",
     "Touristo", "shot_glass", "souvenir", 1.5, "glass",
     "Neon gradient", "New",
     8, 5, "🎰", 3, None, 2,
     "/products/item_14_vegas_shot_glass.png"),
    ("Tiny Leaning Pisa Shot Glass",
     "Touristo", "shot_glass", "gift", 1.5, "glass",
     "Clear + decal", "Used — one sip, one regret",
     7, 9, "🍝", 2, None, 2,
     "/products/item_15_pisa_shot_glass.png"),
    ("12 Mismatched Pint Glasses — 3 breweries",
     "Assorted", "pint_glass", "impulse_buy", 16, "glass",
     "Multi-logo", "Used — ring stains optional",
     7, 5, "🍺", 18, None, 3,
     "/products/item_16_mismatched_pint_glasses.png"),
    ("Craft Brewery 'Hazy IPA' Logo Pint",
     "Foggy Brewing Co.", "pint_glass", "souvenir", 16, "glass",
     "Hazy yellow", "Used — good ring on it",
     5, 3, "🍻", 5, None, 3,
     "/products/item_17_hazy_ipa_pint.png"),
    ("Single Surviving Wine Glass",
     "Crate & Missing", "wine_glass", "inherited", 12, "glass",
     "Clear", "Used — war-survivor",
     4, 9, "🍷", 3, None, 8,
     "/products/item_18_surviving_wine_glass.png"),
    ("Champagne Flutes (Unopened Set of 6)",
     "Crate & Missing", "wine_glass", "gift", 8, "glass",
     "Clear", "New — box still sealed",
     9, 5, "🥂", 22, 60, 8,
     "/products/item_19_champagne_flutes.png"),
    ("Oversized Wine Glass — holds a whole bottle",
     "BigSip Co.", "wine_glass", "gift", 28, "glass",
     "Clear", "Used — dishwasher cloud",
     6, 4, "🍷", 5, 18, 8,
     "/products/item_20_oversized_wine_glass.png"),
    ("Contigo Travel Mug — leaks obviously",
     "Contigone", "travel_mug", "impulse_buy", 16, "plastic + steel",
     "Matte Black", "Used — dripped on every laptop I've owned",
     8, 6, "🔒", 4, 28, 7,
     "/products/item_21_contigo_travel_mug.png"),
    ("Promo Tumbler — bank I no longer use",
     "Wells Far-Away", "tumbler", "conference", 20, "plastic",
     "Beige logo", "Used — logo peeling",
     7, 8, "💳", 2, None, 4,
     "/products/item_22_promo_bank_tumbler.png"),
    ("Emotional Support Water Bottle — 64oz",
     "HydroHug", "water_bottle", "trend", 64, "plastic",
     "Millennial Pink", "New — once carried, never finished",
     9, 2, "💧", 12, 30, 5,
     "/products/item_23_emotional_support_bottle.png"),
    ("Kiln-Fresh Speckled Coffee Mug",
     "Studio Seven", "mug", "gift", 10, "ceramic",
     "Cream + navy speckle", "New",
     5, 4, "☕", 11, None, 9,
     "/products/item_24_speckled_mug.png"),
    ("Mom's 'Live Laugh Love' Mug",
     "Hallmarko", "mug", "inherited", 11, "ceramic",
     "White w/ script", "Used — the handle has stories",
     6, 18, "💐", 6, None, 6,
     "/products/item_25_live_laugh_love_mug.png"),
    ("Souvenir Espresso Cup — Venice",
     "Cafe Marco", "glass", "souvenir", 3, "porcelain",
     "Cobalt trim", "New — display only",
     7, 7, "🇮🇹", 4, None, 2,
     "/products/item_26_venice_espresso_cup.png"),
    ("Novelty 'World's Okayest Boss' Mug",
     "Office Supplies R Us", "novelty", "gift", 12, "ceramic",
     "White + Comic Sans", "Used — workplace-retired",
     8, 5, "🫠", 3, None, 4,
     "/products/item_27_okayest_boss_mug.png"),
    ("Highball Glasses — Set of 4",
     "Ikeah", "glass", "impulse_buy", 12, "glass",
     "Clear", "Used — dishwasher foggy",
     5, 3, "🍸", 10, 24, 7,
     "/products/item_28_highball_glasses_set.png"),
    ("Disney Sorcerer Mickey Mug — Orlando 2011",
     "Parks & Rec", "novelty", "souvenir", 16, "ceramic",
     "Midnight blue + stars", "Used — magical",
     6, 13, "🪄", 12, None, 2,
     "/products/item_29_sorcerer_mickey_mug.png"),
    ("Promotional Law Firm Coffee Mug",
     "Dewey Cheatem & Howe", "mug", "conference", 11, "ceramic",
     "Navy + gold", "New",
     9, 4, "⚖️", 2, None, 4,
     "/products/item_30_law_firm_mug.png"),
    ("Uncle Ray's Thermos — 22 years in the truck cupholder",
     "Thermosi", "travel_mug", "inherited", 16, "stainless steel",
     "Tarnished brushed steel", "Used — permanent coffee ring inside",
     6, 22, "🧳", 5, None, 6,
     "/products/item_31_uncle_rays_thermos.png"),
    # Coverage fillers — one listing per remaining (category, origin) pair.
    # mug × trend
    ("Dubai-Chocolate Viral Mug — bought before tasting the chocolate",
     "Viral Mugs Co.", "mug", "trend", 12, "ceramic",
     "Matcha green w/ gold script", "New — used for one photo",
     9, 1, "🍫", 11, 22, 1,
     "/products/item_32_dubai_chocolate_viral_mug.png"),
    # mug × impulse_buy
    ("Trader's Holiday Gingerbread Mug — bought in July",
     "Trader Jo's", "mug", "impulse_buy", 14, "ceramic",
     "Brown + cream iced-cookie print", "New — seasonally inappropriate",
     7, 2, "🫖", 6, None, 7,
     "/products/item_33_gingerbread_mug_in_july.png"),
    # glass × gift
    ("Wedding-Registry Highball — we never registered for it",
     "Crate & Missing", "glass", "gift", 14, "glass",
     "Clear etched pattern", "New — still in the gift box",
     8, 4, "🥃", 9, None, 8,
     "/products/item_34_wedding_registry_highball.png"),
    # glass × trend
    ("Rippled Stacking Glasses — set of 4, TikTok-famous",
     "Rippl.", "glass", "trend", 10, "glass",
     "Amber ripple", "New — one has waterspots already",
     8, 1, "🌊", 24, 40, 1,
     "/products/item_35_rippled_stacking_glasses.png"),
    # glass × conference
    ("Branded Rocks Glass — Sales Kickoff '22",
     "Kickoff Co.", "glass", "conference", 10, "glass",
     "Navy etched logo", "New — in box, logo outlived the company",
     8, 3, "🥃", 2, None, 4,
     "/products/item_36_sales_kickoff_rocks_glass.png"),
    # glass × inherited
    ("Grandpa's Cut-Crystal Rocks Glass",
     "Lazarus Lead", "glass", "inherited", 10, "glass",
     "Cut crystal, faint amber", "Used — cloudy base, heavy as regret",
     5, 40, "🥃", 15, None, 6,
     "/products/item_37_cut_crystal_rocks_glass.png"),
    # wine_glass × trend
    ("'Rosé All Day' Stemless Wine Glass",
     "BigSip Co.", "wine_glass", "trend", 15, "glass",
     "Clear + pink script", "Used — dishwasher cloud, script faded",
     9, 2, "🌹", 5, 14, 1,
     "/products/item_38_rose_all_day_stemless.png"),
    # wine_glass × conference
    ("Wine Glass from the Gala Table — lanyard still looped on",
     "Convention Events", "wine_glass", "conference", 12, "glass",
     "Clear", "Used — one rim chip, one networking event",
     6, 2, "🍷", 2, None, 4,
     "/products/item_39_gala_wine_glass.png"),
    # wine_glass × souvenir
    ("Napa Tasting Wine Glass — etched vineyard stem",
     "Napa Visitors", "wine_glass", "souvenir", 10, "glass",
     "Etched vineyard logo", "Used — barely, mostly displayed",
     7, 5, "🍇", 4, None, 8,
     "/products/item_40_napa_tasting_wine_glass.png"),
    # wine_glass × impulse_buy
    ("Hearth-Adjacent Ribbed Wine Glass — seasonal aisle",
     "Hearth & Hone", "wine_glass", "impulse_buy", 14, "glass",
     "Clear ribbed", "New — bought in a cart-pile",
     6, 1, "🍷", 6, 14, 7,
     "/products/item_41_ribbed_wine_glass.png"),
    # pint_glass × gift
    ("Wedding-Favor Pint Glass — cousin's monogram",
     "Wed & Co.", "pint_glass", "gift", 16, "glass",
     "Etched monogram", "Used — one reception, one lunchbox trip",
     6, 6, "💍", 3, None, 0,
     "/products/item_42_wedding_favor_pint.png"),
]


def run() -> None:
    """Insert seed data if the items table is empty.

    Relies on Alembic having already migrated the schema — we no longer call
    `create_all` here, because a missing migration should be noisy, not
    silently patched up.
    """
    db = SessionLocal()
    try:
        if db.query(models.Item).count() > 0:
            logger.info("Seed: items already exist; skipping.")
            return

        users: list[models.User] = []
        for username, display_name, verified in SELLERS:
            user = models.User(
                username=username, display_name=display_name, verified=verified
            )
            db.add(user)
            users.append(user)
        db.flush()

        for row in LISTINGS:
            (
                title, brand, drinkware_type, acquisition_source, size_oz,
                material, colorway, condition, shame_index,
                years_in_cupboard, image_emoji, price, original_price,
                seller_idx, image_url,
            ) = row
            db.add(
                models.Item(
                    title=title,
                    brand=brand,
                    drinkware_type=drinkware_type,
                    acquisition_source=acquisition_source,
                    size_oz=_dec(size_oz),
                    material=material,
                    colorway=colorway,
                    condition=condition,
                    shame_index=shame_index,
                    years_in_cupboard=years_in_cupboard,
                    image_emoji=image_emoji,
                    image_url=image_url,
                    price=_dec(price),
                    original_price=_dec(original_price) if original_price is not None else None,
                    seller_id=users[seller_idx].id,
                )
            )

        db.commit()
        logger.info(
            "Seed: inserted %d sellers and %d items.", len(users), len(LISTINGS)
        )
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    run()
