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
#  colorway, condition, confession, shame_index, years_in_cupboard, emoji,
#  price, original_price, seller_idx)
LISTINGS: list[tuple] = [
    ("World's Best Dad Mug — ranked 14th that year",
     "Hallmarko", "mug", "gift", 12, "ceramic",
     "White w/ faded letters", "Used — survived four lunchboxes",
     "Received in 2009. I am the best dad alive, but apparently only the 14th best that Father's Day.",
     8, 16, "👨", 9, 18, 0),
    ("Free Conference 2017 Mug — still branded",
     "DevCon", "mug", "conference", 10, "ceramic",
     "Slate grey", "New — never held a beverage",
     "I attended one session. I have six of these. I have never been to the conference again.",
     9, 8, "🧑‍💻", 4, None, 4),
    ("Starbucks 'You Are Here' Tokyo — city I visited once",
     "Starbuccos", "mug", "souvenir", 14, "ceramic",
     "Cherry blossom pink", "Used — shelf display only",
     "I was in Tokyo for 36 hours. This mug has been in my cupboard for 6 years.",
     7, 6, "🌸", 18, 24, 2),
    ("Mustache Mug — ironic in 2014, now just a mug",
     "HandlebarCo", "novelty", "impulse_buy", 12, "ceramic",
     "Ivory", "Used — slightly chipped lip",
     "It's a mug with a mustache. It seemed very funny at the time. It is no longer very funny.",
     9, 12, "👨‍🦰", 6, 22, 7),
    ("Hand-thrown 'Oops' Ceramic Tumbler",
     "Etsi Studio", "tumbler", "impulse_buy", 10, "ceramic",
     "Speckled moss", "New — studio blemish",
     "My friend started pottery. I had to support. I have eight of her asymmetric pieces.",
     6, 3, "🏺", 14, 48, 9),
    ("Stanley Quencher — 'Valentine's Day Riot' Colorway",
     "Stanleigh", "water_bottle", "trend", 40, "stainless steel",
     "Rose Quartz", "Used — one stampede",
     "Was in line outside Target at 6am. Drank from it twice. It weighs more than my cat.",
     10, 2, "🧴", 28, 55, 1),
    ("Hydro Flask 32oz — sticker residue included",
     "Hydrate Flasque", "water_bottle", "trend", 32, "stainless steel",
     "Pacific Blue", "Used — peeled-sticker chic",
     "Peak 2018 energy. I had an 'adventure' phase. I did not have an adventure phase.",
     7, 7, "🧴", 16, 49, 5),
    ("Owala FreeSip — bought during hydration phase",
     "Owala-ala", "water_bottle", "trend", 24, "stainless steel",
     "Sleepy Sage", "New — used twice",
     "Everyone on TikTok said this was 'the one'. It is, in fact, a bottle.",
     6, 1, "🥤", 18, 36, 1),
    ("Nalgene 32oz — college leftover",
     "Nalgenie", "water_bottle", "impulse_buy", 32, "plastic",
     "Translucent Slate", "Used — carabiner scuffed",
     "Survived every hike I never went on. Also a calculus class.",
     5, 11, "🧴", 6, 20, 5),
    ("Yeti Rambler — heavier than my feelings",
     "Yeti-er", "water_bottle", "impulse_buy", 26, "stainless steel",
     "Charcoal", "Used — one dent of character",
     "Bought it to keep ice cold. Keeps ice cold so well I still haven't finished a drink.",
     6, 4, "🥶", 22, 42, 7),
    ("Stojo Collapsible — never actually collapsed",
     "Stoh-joh", "water_bottle", "trend", 16, "silicone",
     "Lemon", "New — wrapper still on",
     "For my minimalist era. My era lasted 11 minutes.",
     8, 3, "🍋", 8, 25, 7),
    ("I ❤️ NY Shot Glass — from Karen's 36-hour trip",
     "Touristo", "shot_glass", "souvenir", 1.5, "glass",
     "Classic red", "New — displayed, never shot",
     "Karen flew economy once in 2017 and I still hear about it. This is my punishment.",
     9, 8, "🗽", 2, None, 2),
    ("Hard Rock Cafe Prague — 2008",
     "Hard Cafe", "shot_glass", "souvenir", 1.5, "glass",
     "Burgundy", "Used — gathered significant dust",
     "My cousin did a semester abroad and decided my cabinet was her scrapbook.",
     8, 16, "🎸", 3, None, 2),
    ("Vegas 'What Happens Here' Shot Glass",
     "Touristo", "shot_glass", "souvenir", 1.5, "glass",
     "Neon gradient", "New",
     "What happens here is that it now goes in my Gulp sale.",
     8, 5, "🎰", 3, None, 2),
    ("Tiny Leaning Pisa Shot Glass",
     "Touristo", "shot_glass", "gift", 1.5, "glass",
     "Clear + decal", "Used — one sip, one regret",
     "My uncle went to Italy and brought back eight of these for some reason.",
     7, 9, "🍝", 2, None, 2),
    ("12 Mismatched Pint Glasses — 3 breweries",
     "Assorted", "pint_glass", "impulse_buy", 16, "glass",
     "Multi-logo", "Used — ring stains optional",
     "I visited a lot of breweries during 'that' phase. I now have 12 pint glasses and 0 matching sets.",
     7, 5, "🍺", 18, None, 3),
    ("Craft Brewery 'Hazy IPA' Logo Pint",
     "Foggy Brewing Co.", "pint_glass", "souvenir", 16, "glass",
     "Hazy yellow", "Used — good ring on it",
     "Very important pint. I have three of them.",
     5, 3, "🍻", 5, None, 3),
    ("Single Surviving Wine Glass",
     "Crate & Missing", "wine_glass", "inherited", 12, "glass",
     "Clear", "Used — war-survivor",
     "Out of a set of six, this one made it. It is lonely. Give it a friend.",
     4, 9, "🍷", 3, None, 8),
    ("Champagne Flutes (Unopened Set of 6)",
     "Crate & Missing", "wine_glass", "gift", 8, "glass",
     "Clear", "New — box still sealed",
     "Wedding gift. We've never opened bubbly at home. It's been 5 years.",
     9, 5, "🥂", 22, 60, 8),
    ("Oversized Wine Glass — holds a whole bottle",
     "BigSip Co.", "wine_glass", "gift", 28, "glass",
     "Clear", "Used — dishwasher cloud",
     "A friend bought this 'as a joke'. The joke was on my liver.",
     6, 4, "🍷", 5, 18, 8),
    ("Contigo Travel Mug — leaks obviously",
     "Contigone", "travel_mug", "impulse_buy", 16, "plastic + steel",
     "Matte Black", "Used — dripped on every laptop I've owned",
     "The 'one-click' seal works six out of ten times. I commute five days a week. Do the math.",
     8, 6, "🔒", 4, 28, 7),
    ("Promo Tumbler — bank I no longer use",
     "Wells Far-Away", "tumbler", "conference", 20, "plastic",
     "Beige logo", "Used — logo peeling",
     "Got this opening a checking account I closed 7 years ago. Still cold.",
     7, 8, "💳", 2, None, 4),
    ("Emotional Support Water Bottle — 64oz",
     "HydroHug", "water_bottle", "trend", 64, "plastic",
     "Millennial Pink", "New — once carried, never finished",
     "Every influencer told me I need to drink a gallon a day. I drank half a glass.",
     9, 2, "💧", 12, 30, 5),
    ("Kiln-Fresh Speckled Coffee Mug",
     "Studio Seven", "mug", "gift", 10, "ceramic",
     "Cream + navy speckle", "New",
     "Got this at a gift exchange. I drink coffee out of a different mug every day. This mug is new.",
     5, 4, "☕", 11, None, 9),
    ("Mom's 'Live Laugh Love' Mug",
     "Hallmarko", "mug", "inherited", 11, "ceramic",
     "White w/ script", "Used — the handle has stories",
     "Sentimental. Still on the shelf. I have four of these.",
     6, 18, "💐", 6, None, 6),
    ("Souvenir Espresso Cup — Venice",
     "Cafe Marco", "glass", "souvenir", 3, "porcelain",
     "Cobalt trim", "New — display only",
     "I don't drink espresso. I bought three.",
     7, 7, "🇮🇹", 4, None, 2),
    ("Novelty 'World's Okayest Boss' Mug",
     "Office Supplies R Us", "novelty", "gift", 12, "ceramic",
     "White + Comic Sans", "Used — workplace-retired",
     "It was a joke. I laughed at the time. Now it's in my cupboard menacingly.",
     8, 5, "🫠", 3, None, 4),
    ("Highball Glasses — Set of 4",
     "Ikeah", "glass", "impulse_buy", 12, "glass",
     "Clear", "Used — dishwasher foggy",
     "I saw a TikTok about making lemon drops. I made one. These have sat in the cupboard since 2022.",
     5, 3, "🍸", 10, 24, 7),
    ("Disney Sorcerer Mickey Mug — Orlando 2011",
     "Parks & Rec", "novelty", "souvenir", 16, "ceramic",
     "Midnight blue + stars", "Used — magical",
     "Big mug energy. I can't drink 16oz of coffee. Nobody can.",
     6, 13, "🪄", 12, None, 2),
    ("Promotional Law Firm Coffee Mug",
     "Dewey Cheatem & Howe", "mug", "conference", 11, "ceramic",
     "Navy + gold", "New",
     "Gifted after a settlement. I did not want to be reminded. Here it is.",
     9, 4, "⚖️", 2, None, 4),
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
                material, colorway, condition, confession, shame_index,
                years_in_cupboard, image_emoji, price, original_price,
                seller_idx,
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
                    confession=confession,
                    shame_index=shame_index,
                    years_in_cupboard=years_in_cupboard,
                    image_emoji=image_emoji,
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
