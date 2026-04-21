# Feature Implementation Plan — Gulp 🥤

*The marketplace for one too many.*

**Overall Progress:** `100%` (v2 shipped).

## Redesign brief (v2)

v1 borrowed the StockX shoe-marketplace skeleton (lowest ask / highest bid /
last sale, buy vs. bid, "pending authentication"). Drinkware isn't sneakers.
v2 rebuilds the marketplace around the cupboard:

- **One price per cup.** No ask/bid/last-sale triad.
- **"What you paid" anchor.** Optional `original_price` so the UI can roast:
  *"Paid $52 · asking $12."*
- **Take it home / Make an offer.** Single-price CTA with a friendly
  negotiation option; no authentication theatre.
- **Confession-first cards.** Story, shame, and years-on-shelf lead — price
  supports the roast, not the other way around.
- **Keep the ticker.** It stays — it's good.

## TLDR

A mobile-first, parody marketplace for the drinkware-hoarders of the world.
Users list the glasses, novelty mugs, **trend-cycle water bottles**
(Stanley / Hydro Flask / Owala / Nalgene / Yeti), and **souvenir shot glasses
from friends who "travelled"** that are choking their cupboard — and
someone else's cupboard takes them home. The UX pokes fun at the seller:
every listing displays a **Shame Index** and **Years of Shelf Hostage** and
friendly callouts like *"You don't need 6 water bottles. You are one person."*

## Critical Decisions

- **Brand:** "Gulp" — single-syllable, works across every drinkware type
  (mug, bottle, shot, wine, pint, tumbler). Tagline:
  **"The marketplace for one too many."** (double meaning — one too many
  cups *and* one too many drinks). Playful, self-roasting copy; caps-lock
  shame where appropriate.
- **Stack (enforced by `tech-stack` skill):** Next.js (App Router, TypeScript,
  Tailwind) in `web/`, FastAPI + SQLAlchemy 2.0 + Alembic in `api/`, local
  PostgreSQL 16 via Homebrew. No Docker.
- **Mobile-first UI:** single-column layouts by default, sticky bottom tab bar
  on small screens (Home / Browse / Sell), 44px+ tap targets, viewport meta +
  responsive breakpoints up from mobile.
- **Product imagery:** emoji tiles (🫖🥃☕️🍺🍷) instead of uploaded images, to
  keep scope tight and the vibe cheeky. Revisit after v1.
- **Data model (minimal):** `users`, `items` (listing), `offers` (buy/bid).
  Humor fields on `items`: `shame_index` (1–10), `years_in_cupboard`,
  `confession` (short seller story), `drinkware_type` enum — one of
  `mug`, `glass`, `wine_glass`, `pint_glass`, `water_bottle`, `shot_glass`,
  `travel_mug`, `tumbler`, `novelty`. Optional `acquisition_source`
  (`gift`, `trend`, `conference`, `souvenir`, `inherited`, `impulse_buy`)
  for extra roast material.
- **Auth:** skipped for v1. Seller/buyer are just string handles, same as the
  tech-stack skill's minimal skeleton.

## v2 Tasks

- [x] 🟩 **v2.1 Reset schema & DB**
  - [x] 🟩 Dropped `lowest_ask`, `highest_bid`, `last_sale` from `Item`.
  - [x] 🟩 Added `price`, `original_price` (nullable), `is_sold` (bool).
  - [x] 🟩 Dropped + recreated `gulp_marketplace`, wiped
        `alembic/versions`, regenerated single initial migration.

- [x] 🟩 **v2.2 API surface**
  - [x] 🟩 Updated schemas, `/items`, `/items/{id}`, `POST /items`.
  - [x] 🟩 Replaced `sort=hot` with `sort=trending`; added
        `sort=longest_shelf`; kept `price_asc|price_desc|shame_desc|newest`.
  - [x] 🟩 `POST /offers`: omit price → `kind=claim`, `status=claimed`,
        marks item sold; include price → `kind=offer`,
        `status=awaiting_seller`. Optional `message` field.
  - [x] 🟩 `/stats` gains `confessions_on_file` and
        `value_liberated_usd`.

- [x] 🟩 **v2.3 Seed**
  - [x] 🟩 30 listings converted to `price` + optional `original_price`
        for the discount strikethrough roast.

- [x] 🟩 **v2.4 Web client + components**
  - [x] 🟩 Updated `lib/api.ts` types, sort enum, `claim()` and
        `makeOffer()` helpers, `discountPct()` helper.
  - [x] 🟩 `ItemCard` rebuilt: single price, paid-strikethrough,
        confession preview, "Rehomed" overlay when `is_sold`.
  - [x] 🟩 `Ticker` kept — now mixes newest listings, recent
        claims/offers, and roasts.

- [x] 🟩 **v2.5 Pages rebuild (flea-market vibe, not StockX)**
  - [x] 🟩 `/` Home: hero + "Cupboard Liquidation Index" stats card +
        drinkware tile grid + source chips + Freshest regrets +
        Longest shelf sentences + Confessions wall.
  - [x] 🟩 `/browse`: chip filters, full sort set incl. longest_shelf
        and most_shameful.
  - [x] 🟩 `/listing/[id]`: emoji hero, single big price with
        paid-strikethrough + -% off regret, Take it home / Make an offer
        `ClaimPanel`, full confession, spec dl, seller card.
  - [x] 🟩 `/sell`: `price` + optional `original_price` inputs.

- [x] 🟩 **v2.6 End-to-end smoke**
  - [x] 🟩 Both servers boot; home/browse/listing/sell return 200;
        create → claim → is_sold round-trip verified.

## Legacy v1 progress (superseded)

- [x] 🟩 **Step 1: Preflight & Postgres**
  - [x] 🟩 Verify `node`, `npm`, `python3`, `pip3`, `brew` (Node 18+ OK;
        Tailwind pinned to v3 if Node < 20).
  - [x] 🟩 `brew install postgresql@16` (skip if already installed) and
        `brew services start postgresql@16`.
  - [x] 🟩 Create role + DB: `gulp` / `gulp` / `gulp_marketplace`.

- [x] 🟩 **Step 2: FastAPI service in `api/`**
  - [x] 🟩 `python -m venv .venv`; install `fastapi`, `uvicorn[standard]`,
        `sqlalchemy>=2`, `alembic`, `psycopg2-binary`, `pydantic-settings`,
        `python-dotenv`; freeze to `requirements.txt`.
  - [x] 🟩 `app/{main,config,db,models,schemas}.py` with CORS for
        `http://localhost:3000` and a `/health` endpoint.
  - [x] 🟩 Models: `User`, `Item` (title, brand, drinkware_type,
        acquisition_source, size_oz, material, colorway, condition,
        confession, shame_index, years_in_cupboard, image_emoji,
        lowest_ask, highest_bid, last_sale, seller_id), `Offer` (item_id,
        buyer_username, price, status).
  - [x] 🟩 `alembic init`, wire `env.py` to project metadata, generate +
        apply initial migration.
  - [x] 🟩 `.env.example` with `DATABASE_URL` and `CORS_ORIGINS`.

- [x] 🟩 **Step 3: API endpoints**
  - [x] 🟩 `GET /health`, `GET /stats` (total items, total years in
        cupboards, average shame index — for the home hero).
  - [x] 🟩 `GET /items` with `q`, `drinkware_type`, `acquisition_source`,
        `sort` (hot / price_asc / price_desc / shame_desc / newest),
        `limit`.
  - [x] 🟩 `GET /items/{id}`, `POST /items`, `GET /items/types` (counts by
        `drinkware_type`).
  - [x] 🟩 `POST /offers` (buy-now or bid) and `GET /offers` (recent).

- [x] 🟩 **Step 4: Seed data (the fun part)**
  - [x] 🟩 `seed.py` with ~30 parody listings spanning every
        `drinkware_type`, including:
        - **Mugs:** "World's Best Dad (ranked 14th)", "Free Conference 2017
          Mug — Still Branded", "Starbucks city mug — city I visited once".
        - **Novelty:** "Hand-thrown Oops Ceramic", "Mustache Mug — ironic
          in 2014, now just a mug".
        - **Water bottles (trend tax):** "Stanley Quencher — Valentine's
          Riot Edition", "Hydro Flask — sticker residue included", "Owala
          FreeSip — bought during hydration phase", "Nalgene 32oz — college
          leftover", "Yeti Rambler — heavier than my feelings", "Stojo
          collapsible — never actually collapsed".
        - **Shot glasses (travel-gift tax):** "I ❤️ NY Shot Glass (from
          Karen who flew economy once)", "Hard Rock Cafe Prague — 2008",
          "Vegas 'What Happens Here' shot glass — what happens here is it
          goes in my sale", "Tiny leaning Pisa shot glass".
        - **Glassware:** "12 mismatched pint glasses from 3 breweries",
          "Single wine glass — the survivor", "Entire champagne flute set
          (never opened bubbly)".
        - **Travel mugs / tumbrlers:** "Contigo that leaks — obviously",
          "Random promo tumbler from a bank I no longer use".
  - [x] 🟩 Each with a `confession`, `shame_index`, `years_in_cupboard`,
        and a matching `acquisition_source`.
  - [x] 🟩 Idempotent (skip if data exists).

- [x] 🟩 **Step 5: Next.js web app in `web/`**
  - [x] 🟩 `create-next-app@latest --typescript --tailwind --app --src-dir`,
        pin Next 15 + Tailwind 3 if on Node 18.
  - [x] 🟩 `src/lib/api.ts` typed client reading `NEXT_PUBLIC_API_BASE_URL`.
  - [x] 🟩 `src/app/layout.tsx` with viewport meta, brand header, and
        mobile bottom tab bar that collapses on `md+`.
  - [x] 🟩 Tailwind theme tokens (background, foreground, accent, muted) in
        `globals.css` tuned for a warm kitchen-beige feel.

- [x] 🟩 **Step 6: Mobile-first pages**
  - [x] 🟩 `/` Home: hero ("The marketplace for one too many." + subhead
        "Your cupboard called. It wants a divorce."),
        live stats row, featured items grid (2-col mobile / 4-col desktop),
        and chip rows for both `drinkware_type` and `acquisition_source`
        ("Trend tax", "Friend-who-travelled", "Conference swag", etc.).
  - [x] 🟩 `/browse`: search input, scrollable `drinkware_type` chip row
        (Mug / Glass / Water Bottle / Shot Glass / Wine / Pint / Travel Mug
        / Tumbler / Novelty), sort chips including "Most Shameful",
        responsive grid.
  - [x] 🟩 `/listing/[id]`: big emoji hero, price tiles (ask / bid / last
        sale), **Shame Meter** (colored bar), `acquisition_source` badge,
        seller confession, Buy / Bid panel (client component).
  - [x] 🟩 `/sell`: mobile-friendly form — title, `drinkware_type` select,
        `acquisition_source` select, emoji picker (☕️🥛🍺🍷🥃🧴🥤🫙),
        size_oz, years in cupboard slider, shame index slider, confession
        textarea, price fields, submit.
  - [x] 🟩 `not-found.tsx` with a "this cup is missing from its saucer"
        404 joke.

- [x] 🟩 **Step 7: Humor & polish layer**
  - [x] 🟩 Copy pass: microcopy across buttons, empty states, and tooltips
        ("List a cup", "Retire this mug", "Free them from the shelf").
  - [x] 🟩 Shame Meter component used on cards and detail page.
  - [x] 🟩 Animated ticker with snarky one-liners based on recent listings.
  - [x] 🟩 Accessibility basics: labels, focus rings, `aria-live` for
        buy/bid status.

- [x] 🟩 **Step 8: Skills, README, and smoke test**
  - [x] 🟩 Add concise `.cursor/skills/` entries for `nextjs-app`,
        `fastapi-service`, `postgres-local` (reusable for future apps).
  - [x] 🟩 Root `README.md`: layout, one-time setup, run commands, smoke
        tests (`curl /health`, `curl /stats`, `POST /offers`), reset-DB
        recipe.
  - [x] 🟩 End-to-end check: both servers boot, home / browse / listing /
        sell return 200, creating a cup + placing an offer round-trips.

## Out of scope (for now)

- Real auth, payments, image uploads
- Order fulfillment / shipping flow
- Deployment (can be picked up with the `deploy-to-gcp-serverless` skill
  later)
- Admin moderation (e.g. auto-rejecting mugs with *actual* mugshots)
