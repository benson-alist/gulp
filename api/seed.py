"""Seed Gulp with a glorious gallery of drinkware regret.

On first run it creates sellers + listings. If users already exist but
lack real credentials (e.g. you ran an older seed before the auth
migration), it backfills ``email`` + ``password_hash`` so those accounts
become usable — and rewrites any placeholder ``@gulp.local`` emails the
migration inserted to the real dev domain below. Run with:
``python seed.py`` from inside the activated API virtualenv.

Schema is v3 — each listing has a single asking `price` and, where it
sharpens the roast, an `original_price` ("what the seller paid"); users
now log in with email + password, and offers are owned by real accounts.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from app import auth, models
from app.db import SessionLocal
from app.flip_buyer_view_reset import clear_resolved_flip_buyer_views


logger = logging.getLogger("gulp.seed")


def _dec(value) -> Decimal:
    """Coerce numeric-ish values into a 2dp `Decimal` for currency columns."""
    return Decimal(str(value)).quantize(Decimal("0.01"))


# A single shared dev password keeps local exploration frictionless. Never
# reuse this in any environment that isn't explicitly a scratch DB.
DEV_PASSWORD = "gulp1234"

# The email-validator library rejects reserved TLDs like `.local` and
# `.test`, so we use a real-looking (and syntactically valid) domain for
# seed emails. It's never sent to; it's just the login identifier.
DEV_EMAIL_DOMAIN = "gulp.market"

# (username, display_name, verified). Email is derived as
# ``{username}@{DEV_EMAIL_DOMAIN}``; password is the shared dev password above.
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

# The three accounts highlighted in docs + the login page. Pick names that
# also happen to have listings in the seed corpus so demos are immediately
# interesting.
DEMO_USERNAMES = {"dad_of_four", "trendy_tessa", "brewery_bill"}


# (title, brand, drinkware_type, acquisition_source, size_oz, material,
#  colorway, condition, years_in_cupboard, emoji,
#  price, original_price, seller_idx, image_url)
#
# `image_url` points at an illustration served from `web/public/products/`.
# Keep this list in the same order the images were generated so each row
# lines up with the matching asset (item_01_ → row 0, item_02_ → row 1, …).
LISTINGS: list[tuple] = [
    ("World's Best Dad Mug — ranked 14th that year",
     "Hallmarko", "mug", "gift", 12, "ceramic",
     "White w/ faded letters", "Used — survived four lunchboxes",
     16, "👨", 9, 18, 0,
     "/products/item_01_worlds_best_dad_mug.png"),
    ("Free Conference 2017 Mug — still branded",
     "DevCon", "mug", "conference", 10, "ceramic",
     "Slate grey", "New — never held a beverage",
     8, "🧑‍💻", 4, None, 4,
     "/products/item_02_devcon_2017_mug.png"),
    ("Starbucks 'You Are Here' Tokyo — city I visited once",
     "Starbuccos", "mug", "souvenir", 14, "ceramic",
     "Cherry blossom pink", "Used — shelf display only",
     6, "🌸", 18, 24, 2,
     "/products/item_03_tokyo_starbucks_mug.png"),
    ("Mustache Mug — ironic in 2014, now just a mug",
     "HandlebarCo", "novelty", "impulse_buy", 12, "ceramic",
     "Ivory", "Used — slightly chipped lip",
     12, "👨‍🦰", 6, 22, 7,
     "/products/item_04_mustache_mug.png"),
    ("Hand-thrown 'Oops' Ceramic Tumbler",
     "Etsi Studio", "tumbler", "impulse_buy", 10, "ceramic",
     "Speckled moss", "New — studio blemish",
     3, "🏺", 14, 48, 9,
     "/products/item_05_oops_ceramic_tumbler.png"),
    ("Stanley Quencher — 'Valentine's Day Riot' Colorway",
     "Stanleigh", "water_bottle", "trend", 40, "stainless steel",
     "Rose Quartz", "Used — one stampede",
     2, "🧴", 28, 55, 1,
     "/products/item_06_stanley_valentines_riot.png"),
    ("Hydro Flask 32oz — sticker residue included",
     "Hydrate Flasque", "water_bottle", "trend", 32, "stainless steel",
     "Pacific Blue", "Used — peeled-sticker chic",
     7, "🧴", 16, 49, 5,
     "/products/item_07_hydroflask_sticker_residue.png"),
    ("Owala FreeSip — bought during hydration phase",
     "Owala-ala", "water_bottle", "trend", 24, "stainless steel",
     "Sleepy Sage", "New — used twice",
     1, "🥤", 18, 36, 1,
     "/products/item_08_owala_freesip.png"),
    ("Nalgene 32oz — college leftover",
     "Nalgenie", "water_bottle", "impulse_buy", 32, "plastic",
     "Translucent Slate", "Used — carabiner scuffed",
     11, "🧴", 6, 20, 5,
     "/products/item_09_nalgene_college.png"),
    ("Yeti Rambler — heavier than my feelings",
     "Yeti-er", "water_bottle", "impulse_buy", 26, "stainless steel",
     "Charcoal", "Used — one dent of character",
     4, "🥶", 22, 42, 7,
     "/products/item_10_yeti_rambler.png"),
    ("Stojo Collapsible — never actually collapsed",
     "Stoh-joh", "water_bottle", "trend", 16, "silicone",
     "Lemon", "New — wrapper still on",
     3, "🍋", 8, 25, 7,
     "/products/item_11_stojo_collapsible.png"),
    ("I ❤️ NY Shot Glass — from Karen's 36-hour trip",
     "Touristo", "shot_glass", "souvenir", 1.5, "glass",
     "Classic red", "New — displayed, never shot",
     8, "🗽", 2, None, 2,
     "/products/item_12_iloveny_shot_glass.png"),
    ("Hard Rock Cafe Prague — 2008",
     "Hard Cafe", "shot_glass", "souvenir", 1.5, "glass",
     "Burgundy", "Used — gathered significant dust",
     16, "🎸", 3, None, 2,
     "/products/item_13_hardrock_prague_shot_glass.png"),
    ("Vegas 'What Happens Here' Shot Glass",
     "Touristo", "shot_glass", "souvenir", 1.5, "glass",
     "Neon gradient", "New",
     5, "🎰", 3, None, 2,
     "/products/item_14_vegas_shot_glass.png"),
    ("Tiny Leaning Pisa Shot Glass",
     "Touristo", "shot_glass", "gift", 1.5, "glass",
     "Clear + decal", "Used — one sip, one regret",
     9, "🍝", 2, None, 2,
     "/products/item_15_pisa_shot_glass.png"),
    ("12 Mismatched Pint Glasses — 3 breweries",
     "Assorted", "pint_glass", "impulse_buy", 16, "glass",
     "Multi-logo", "Used — ring stains optional",
     5, "🍺", 18, None, 3,
     "/products/item_16_mismatched_pint_glasses.png"),
    ("Craft Brewery 'Hazy IPA' Logo Pint",
     "Foggy Brewing Co.", "pint_glass", "souvenir", 16, "glass",
     "Hazy yellow", "Used — good ring on it",
     3, "🍻", 5, None, 3,
     "/products/item_17_hazy_ipa_pint.png"),
    ("Single Surviving Wine Glass",
     "Crate & Missing", "wine_glass", "inherited", 12, "glass",
     "Clear", "Used — war-survivor",
     9, "🍷", 3, None, 8,
     "/products/item_18_surviving_wine_glass.png"),
    ("Champagne Flutes (Unopened Set of 6)",
     "Crate & Missing", "wine_glass", "gift", 8, "glass",
     "Clear", "New — box still sealed",
     5, "🥂", 22, 60, 8,
     "/products/item_19_champagne_flutes.png"),
    ("Oversized Wine Glass — holds a whole bottle",
     "BigSip Co.", "wine_glass", "gift", 28, "glass",
     "Clear", "Used — dishwasher cloud",
     4, "🍷", 5, 18, 8,
     "/products/item_20_oversized_wine_glass.png"),
    ("Contigo Travel Mug — leaks obviously",
     "Contigone", "travel_mug", "impulse_buy", 16, "plastic + steel",
     "Matte Black", "Used — dripped on every laptop I've owned",
     6, "🔒", 4, 28, 7,
     "/products/item_21_contigo_travel_mug.png"),
    ("Promo Tumbler — bank I no longer use",
     "Wells Far-Away", "tumbler", "conference", 20, "plastic",
     "Beige logo", "Used — logo peeling",
     8, "💳", 2, None, 4,
     "/products/item_22_promo_bank_tumbler.png"),
    ("Emotional Support Water Bottle — 64oz",
     "HydroHug", "water_bottle", "trend", 64, "plastic",
     "Millennial Pink", "New — once carried, never finished",
     2, "💧", 12, 30, 5,
     "/products/item_23_emotional_support_bottle.png"),
    ("Kiln-Fresh Speckled Coffee Mug",
     "Studio Seven", "mug", "gift", 10, "ceramic",
     "Cream + navy speckle", "New",
     4, "☕", 11, None, 9,
     "/products/item_24_speckled_mug.png"),
    ("Mom's 'Live Laugh Love' Mug",
     "Hallmarko", "mug", "inherited", 11, "ceramic",
     "White w/ script", "Used — the handle has stories",
     18, "💐", 6, None, 6,
     "/products/item_25_live_laugh_love_mug.png"),
    ("Souvenir Espresso Cup — Venice",
     "Cafe Marco", "glass", "souvenir", 3, "porcelain",
     "Cobalt trim", "New — display only",
     7, "🇮🇹", 4, None, 2,
     "/products/item_26_venice_espresso_cup.png"),
    ("Novelty 'World's Okayest Boss' Mug",
     "Office Supplies R Us", "novelty", "gift", 12, "ceramic",
     "White + Comic Sans", "Used — workplace-retired",
     5, "🫠", 3, None, 4,
     "/products/item_27_okayest_boss_mug.png"),
    ("Highball Glasses — Set of 4",
     "Ikeah", "glass", "impulse_buy", 12, "glass",
     "Clear", "Used — dishwasher foggy",
     3, "🍸", 10, 24, 7,
     "/products/item_28_highball_glasses_set.png"),
    ("Disney Sorcerer Mickey Mug — Orlando 2011",
     "Parks & Rec", "novelty", "souvenir", 16, "ceramic",
     "Midnight blue + stars", "Used — magical",
     13, "🪄", 12, None, 2,
     "/products/item_29_sorcerer_mickey_mug.png"),
    ("Promotional Law Firm Coffee Mug",
     "Dewey Cheatem & Howe", "mug", "conference", 11, "ceramic",
     "Navy + gold", "New",
     4, "⚖️", 2, None, 4,
     "/products/item_30_law_firm_mug.png"),
    ("Uncle Ray's Thermos — 22 years in the truck cupholder",
     "Thermosi", "travel_mug", "inherited", 16, "stainless steel",
     "Tarnished brushed steel", "Used — permanent coffee ring inside",
     22, "🧳", 5, None, 6,
     "/products/item_31_uncle_rays_thermos.png"),
    # Coverage fillers — one listing per remaining (category, origin) pair.
    # mug × trend
    ("Dubai-Chocolate Viral Mug — bought before tasting the chocolate",
     "Viral Mugs Co.", "mug", "trend", 12, "ceramic",
     "Matcha green w/ gold script", "New — used for one photo",
     1, "🍫", 11, 22, 1,
     "/products/item_32_dubai_chocolate_viral_mug.png"),
    # mug × impulse_buy
    ("Trader's Holiday Gingerbread Mug — bought in July",
     "Trader Jo's", "mug", "impulse_buy", 14, "ceramic",
     "Brown + cream iced-cookie print", "New — seasonally inappropriate",
     2, "🫖", 6, None, 7,
     "/products/item_33_gingerbread_mug_in_july.png"),
    # glass × gift
    ("Wedding-Registry Highball — we never registered for it",
     "Crate & Missing", "glass", "gift", 14, "glass",
     "Clear etched pattern", "New — still in the gift box",
     4, "🥃", 9, None, 8,
     "/products/item_34_wedding_registry_highball.png"),
    # glass × trend
    ("Rippled Stacking Glasses — set of 4, TikTok-famous",
     "Rippl.", "glass", "trend", 10, "glass",
     "Amber ripple", "New — one has waterspots already",
     1, "🌊", 24, 40, 1,
     "/products/item_35_rippled_stacking_glasses.png"),
    # glass × conference
    ("Branded Rocks Glass — Sales Kickoff '22",
     "Kickoff Co.", "glass", "conference", 10, "glass",
     "Navy etched logo", "New — in box, logo outlived the company",
     3, "🥃", 2, None, 4,
     "/products/item_36_sales_kickoff_rocks_glass.png"),
    # glass × inherited
    ("Grandpa's Cut-Crystal Rocks Glass",
     "Lazarus Lead", "glass", "inherited", 10, "glass",
     "Cut crystal, faint amber", "Used — cloudy base, heavy as regret",
     40, "🥃", 15, None, 6,
     "/products/item_37_cut_crystal_rocks_glass.png"),
    # wine_glass × trend
    ("'Rosé All Day' Stemless Wine Glass",
     "BigSip Co.", "wine_glass", "trend", 15, "glass",
     "Clear + pink script", "Used — dishwasher cloud, script faded",
     2, "🌹", 5, 14, 1,
     "/products/item_38_rose_all_day_stemless.png"),
    # wine_glass × conference
    ("Wine Glass from the Gala Table — lanyard still looped on",
     "Convention Events", "wine_glass", "conference", 12, "glass",
     "Clear", "Used — one rim chip, one networking event",
     2, "🍷", 2, None, 4,
     "/products/item_39_gala_wine_glass.png"),
    # wine_glass × souvenir
    ("Napa Tasting Wine Glass — etched vineyard stem",
     "Napa Visitors", "wine_glass", "souvenir", 10, "glass",
     "Etched vineyard logo", "Used — barely, mostly displayed",
     5, "🍇", 4, None, 8,
     "/products/item_40_napa_tasting_wine_glass.png"),
    # wine_glass × impulse_buy
    ("Hearth-Adjacent Ribbed Wine Glass — seasonal aisle",
     "Hearth & Hone", "wine_glass", "impulse_buy", 14, "glass",
     "Clear ribbed", "New — bought in a cart-pile",
     1, "🍷", 6, 14, 7,
     "/products/item_41_ribbed_wine_glass.png"),
    # pint_glass × gift
    ("Wedding-Favor Pint Glass — cousin's monogram",
     "Wed & Co.", "pint_glass", "gift", 16, "glass",
     "Etched monogram", "Used — one reception, one lunchbox trip",
     6, "💍", 3, None, 0,
     "/products/item_42_wedding_favor_pint.png"),
]


def _print_demo_banner() -> None:
    """Print login credentials for the three demo accounts.

    Meant for humans running seed locally — pulls the highlighted trio out
    of ``DEMO_USERNAMES`` and renders a small terminal table.
    """
    print("\n" + "=" * 60)
    print("  Gulp demo accounts (all share password: {})".format(DEV_PASSWORD))
    print("=" * 60)
    for username, display_name, _verified in SELLERS:
        if username in DEMO_USERNAMES:
            print(f"  {display_name:<32}  {username}@{DEV_EMAIL_DOMAIN}")
    print("=" * 60 + "\n")


def _backfill_passwords(db) -> int:
    """Bring pre-auth user rows up to the v3 shape.

    Two things can be stale after an upgrade:

    1. ``password_hash`` is the placeholder ``'pending-reseed'`` inserted by
       the auth migration — replace it with a real bcrypt hash.
    2. ``email`` was written as ``{username}@gulp.local`` by the migration;
       ``.local`` is a reserved TLD that ``email-validator`` rejects on
       login, so rewrite it to the real dev domain.

    Returns the number of users touched. Idempotent — re-running never
    invalidates working credentials or emails.
    """
    touched = 0
    pending = (
        db.query(models.User)
        .filter(models.User.password_hash == "pending-reseed")
        .all()
    )
    hashed = auth.hash_password(DEV_PASSWORD) if pending else None
    for user in pending:
        user.password_hash = hashed
        touched += 1

    stale_emails = (
        db.query(models.User)
        .filter(models.User.email.like("%@gulp.local"))
        .all()
    )
    for user in stale_emails:
        user.email = f"{user.username}@{DEV_EMAIL_DOMAIN}"
        touched += 1

    if touched:
        db.commit()
    return touched


def _dev_reset_flip_buyer_views(db) -> None:
    """Clear flip reveal stamps so **My bids** shows unseen settled flips again.

    Runs at the end of every ``seed.py`` invocation (idempotent). Safe on dev
    DBs only; do not rely on this in production workflows.
    """
    n = clear_resolved_flip_buyer_views(db)
    db.commit()
    if n:
        logger.info(
            "Seed: cleared buyer view stamp on %d resolved flip offer(s).",
            n,
        )


def _seed_demo_flip(
    db, users: list[models.User], items: list[models.Item]
) -> None:
    """Insert one **resolved** coin-flip offer so seeded dashboards show a settled flip.

    Picks the first listing owned by ``dad_of_four`` (a seller highlighted on
    the docs/login screen) and records a flip from ``trendy_tessa`` that has
    already settled (buyer wins at ``low_price``). The listing is marked sold
    to match production behavior (instant resolution on ``POST /offers``).

    No-ops silently if either account or a usable listing is missing, so
    curated-seed customizations don't break startup.
    """
    by_username = {u.username: u for u in users}
    seller = by_username.get("dad_of_four")
    buyer = by_username.get("trendy_tessa")
    if seller is None or buyer is None:
        return

    demo_item = next(
        (i for i in items if i.seller_id == seller.id and not i.is_sold),
        None,
    )
    if demo_item is None:
        return

    asking = Decimal(demo_item.price)
    low = (asking * Decimal("0.5")).quantize(Decimal("0.01"))
    high = (asking * Decimal("1.5")).quantize(Decimal("0.01"))
    if not (low < asking < high):
        return

    buyer_won = True
    settlement = low if buyer_won else high
    status_ = "flipped_won" if buyer_won else "flipped_lost"
    outcome = "win" if buyer_won else "lose"
    demo_item.is_sold = True

    db.add(
        models.Offer(
            item_id=demo_item.id,
            buyer_id=buyer.id,
            price=settlement,
            kind="flip",
            status=status_,
            message="Feeling lucky — flip for it?",
            low_price=low,
            high_price=high,
            flip_outcome=outcome,
        )
    )


def run() -> None:
    """Insert seed data if the items table is empty, then ensure accounts work.

    Relies on Alembic having already migrated the schema — we no longer
    call ``create_all`` here, because a missing migration should be noisy,
    not silently patched up.

    After either a full insert or the \"already seeded\" path, clears
    ``viewed_by_buyer_at`` on all resolved flips so local **My bids** reveal
    UX stays easy to re-test.
    """
    db = SessionLocal()
    try:
        if db.query(models.Item).count() > 0:
            backfilled = _backfill_passwords(db)
            if backfilled:
                logger.info(
                    "Seed: items already exist; fixed %d stale auth row(s).",
                    backfilled,
                )
            else:
                logger.info("Seed: items already exist; skipping.")
            _print_demo_banner()
            _dev_reset_flip_buyer_views(db)
            return

        hashed = auth.hash_password(DEV_PASSWORD)
        users: list[models.User] = []
        for username, display_name, verified in SELLERS:
            user = models.User(
                email=f"{username}@{DEV_EMAIL_DOMAIN}",
                username=username,
                display_name=display_name,
                password_hash=hashed,
                verified=verified,
            )
            db.add(user)
            users.append(user)
        db.flush()

        items: list[models.Item] = []
        for row in LISTINGS:
            (
                title, brand, drinkware_type, acquisition_source, size_oz,
                material, colorway, condition,
                years_in_cupboard, image_emoji, price, original_price,
                seller_idx, image_url,
            ) = row
            item = models.Item(
                title=title,
                brand=brand,
                drinkware_type=drinkware_type,
                acquisition_source=acquisition_source,
                size_oz=_dec(size_oz),
                material=material,
                colorway=colorway,
                condition=condition,
                years_in_cupboard=years_in_cupboard,
                image_emoji=image_emoji,
                image_url=image_url,
                price=_dec(price),
                original_price=_dec(original_price) if original_price is not None else None,
                seller_id=users[seller_idx].id,
            )
            db.add(item)
            items.append(item)

        db.flush()
        _seed_demo_flip(db, users, items)
        db.commit()
        logger.info(
            "Seed: inserted %d sellers and %d items.", len(users), len(LISTINGS)
        )
        _print_demo_banner()
        _dev_reset_flip_buyer_views(db)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    run()
