# Coin flip feature — implementation progress

A buyer can propose "flip a coin on it" instead of claiming or bidding:
they pick two prices (a low if they win, a high if they lose). The seller
accepts; the server flips a fair coin and records the outcome. Item is
marked sold at the resulting price.

## Design snapshot

- Stored on the existing `offers` table as `kind = "flip"`.
- New columns: `low_price`, `high_price`, `flip_outcome` (nullable), `viewed_by_buyer_at` (nullable).
- New statuses: `flipped_won`, `flipped_lost`.
- Validation: `0 <= low_price < item.price < high_price`.
- Resolution: `POST /offers/{id}/flip` — seller-only, uses `secrets.randbelow(2)`.
- Rejection: `POST /offers/{id}/reject` — seller-only, works for any pending offer.
- Buyer reveal ack: `POST /offers/{id}/view` — idempotent stamp for first-time reveal UI.
- UI: listing "Flip for it" tab; seller resolves via shared **modal** coin animation; buyer **My bids** highlights unseen settled flips; tap opens the same modal, then marks viewed.

## Steps

| Step | Status | Notes |
|------|--------|-------|
| Tracker doc | ✅ | this file |
| Model: `Offer` fields + enums | ✅ | `low_price`, `high_price`, `flip_outcome` + CHECK |
| Alembic migration (coin flip) | ✅ | `f7c1b20d8a93_add_offer_coin_flip.py` |
| Alembic migration (`viewed_by_buyer_at`) | ✅ | `b8e3f91a2c04_add_offer_viewed_by_buyer_at.py` |
| Pydantic schemas | ✅ | `OfferCreate` + `OfferOut` + `viewed_by_buyer_at` |
| API endpoints | ✅ | `POST /offers`, `POST /offers/{id}/flip`, `reject`, **`view`** |
| Seed demo flip | ✅ | pending flip between seeded users |
| TS client (`api.ts`) | ✅ | `markFlipViewed`, `viewed_by_buyer_at` on `Offer` |
| ClaimPanel flip tab | ✅ | two-price form |
| Dashboard seller | ✅ | `FlipResolver` + shared `CoinFlipModal` |
| Dashboard buyer | ✅ | unseen settled flip pulse + tap-to-reveal modal |
| Shared `CoinFlipModal` | ✅ | [web/src/components/CoinFlipModal.tsx](web/src/components/CoinFlipModal.tsx) |
| Backend pytest (flips + view) | ✅ | idempotent + guards |
| Bugfix: Postgres-safe row lock | ✅ | `with_for_update(of=models.Offer)` |
| Verify: pytest + `tsc` | ✅ | 49 API tests; web typecheck clean |

## Reveal animation v2

| Step | Status | Notes |
|------|--------|-------|
| `viewed_by_buyer_at` column | ✅ | migration `b8e3f91a2c04` |
| `POST /offers/{id}/view` | ✅ | buyer-only, resolved flip only |
| Buyer bids: highlight + modal | ✅ | no price/outcome in list until after reveal |
| Seller: modal on flip | ✅ | replaces inline-only spin |
| CSS: `flip-unseen-pulse` | ✅ | [web/src/app/globals.css](web/src/app/globals.css) |
| Coin polish: X-axis tumble + arc + shadow | ✅ | `coin-flip` / `coin-shadow` keyframes |
| Coin polish: Gulp-branded SVG faces | ✅ | medallic heads (check) / tails (``G``) in `CoinFlipModal` |
| Coin drama v3: longer spin + medallic art | ✅ | 2.8s / 12 tumbles; rim + check / monogram faces |
| Coin drama v4: parabolic toss with hangtime | ✅ | 5s linear; anticipation/launch/apex/descent/2 bounces; Z wobble; perspective 760 |
| Coin drama v3: deal price hero + fx | ✅ | confetti vs rain; seller inverts celebration |
| Spin/API timing constant | ✅ | `COIN_FLIP_SPIN_MS` + `flipPerspective` on modal |
| Dev: reset buyer view stamps (shared helper) | ✅ | [`api/app/flip_buyer_view_reset.py`](api/app/flip_buyer_view_reset.py) |
| Dev: `seed.py` clears stamps every run | ✅ | `_dev_reset_flip_buyer_views` (full + skip paths) |
| Dev: optional boot reset | ✅ | `RESET_FLIP_BUYER_VIEWS_ON_BOOT` · skipped under pytest (`GULP_RUNNING_TESTS`) |
| Maintainer Cursor rule | ✅ | [`.cursor/rules/coin-flip-testing.mdc`](.cursor/rules/coin-flip-testing.mdc) |

## Maintainer workflow (coin flip)

When editing this feature, keep **My bids** “unseen reveal” easy to verify:

1. Copy [`api/.env.example`](api/.env.example) line `RESET_FLIP_BUYER_VIEWS_ON_BOOT=true` into your `api/.env` (or run `python seed.py` / `python reset_flip_buyer_views.py` after changes).
2. Cursor agents matching [`.cursor/rules/coin-flip-testing.mdc`](.cursor/rules/coin-flip-testing.mdc) should follow that rule after substantive flip changes.

## Local testing

1. **Stack:** Terminal A: `cd api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000` · Terminal B: `cd web && PORT=3000 npm run dev`
2. **Seller resolves a flip:** Log in as a seller (e.g. `dad_of_four@gulp.market` / `gulp1234`), open **Dashboard → My listings → View bids** on an item with a pending flip, click **Flip the coin** (or create a flip from another account first).
3. **Buyer reveal:** Log in as the buyer who proposed the flip, open **Dashboard → My bids**. A settled flip with no view stamp shows the pulsing border and **Result ready · tap to reveal**; tap to run the modal, then **Close**.
4. **Re-test “unseen” state:** Any of:
   - **`RESET_FLIP_BUYER_VIEWS_ON_BOOT=true`** in `api/.env` → restart `uvicorn` (clears stamps once per boot; **off in prod**).
   - **`python seed.py`** → clears stamps at the end of every invocation.
   - **One-shot:** `source .venv/bin/activate && python reset_flip_buyer_views.py`

   Each clears `viewed_by_buyer_at` on **all** `flipped_won` / `flipped_lost` rows so **My bids** shows the pulsing “tap to reveal” state again.

**Overall: 100%** 🎯 (coin drama, celebration, dev reset ergonomics)
