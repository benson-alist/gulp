# Playful illustrated redesign — progress

Design system pass: **Bagel Fat One** (display) + **Familjen Grotesk** (sans) + **Geist Mono** (mono), sticker-ink CSS variables, **late-night** `html[data-theme="dark"]`, SVG illo primitives, sticker-peel hovers, and page sweeps across chrome + core flows.

## Steps

| Step | Status | Notes |
|------|--------|-------|
| Tokens + dark theme (`globals.css`) | ✅ | `--ink-*`, `--shadow-sticker`, `--shadow-paper`, `prefers-reduced-motion` |
| Tailwind extend | ✅ | [web/tailwind.config.ts](web/tailwind.config.ts) |
| Fonts + `beforeInteractive` theme init | ✅ | [web/src/app/layout.tsx](web/src/app/layout.tsx) + `ThemeToggle` |
| Motion: bob, sticker-peel, wobble, scribble, parallax | ✅ | [web/src/app/globals.css](web/src/app/globals.css), [web/src/lib/useScroll.ts](web/src/lib/useScroll.ts) |
| `components/illo/*` | ✅ | Scribble*, StickerBadge, TapeStrip, dividers, Halftone, SparkleBurst, MascotPeek |
| Shared: Field, Stat, SectionHeader, EmptyState, ItemCard | ✅ | [web/src/components/](web/src/components/) |
| Layout chrome + footer mascot | ✅ | Halftone header, `MascotPeek` |
| Home | ✅ | ParallaxVars, torn-paper stats, shelf how-it-works, dividers |
| Browse | ✅ | Sticker chips, tilted grid, `EmptyState` |
| Listing + ClaimPanel | ✅ | TapeStrip price, sticker badges, shadow-sticker |
| Sell | ✅ | Shared `Field`, error row + hero PNG |
| Auth | ✅ | Split hero + tilted form cards |
| Dashboard | ✅ | Shared `EmptyState`, sticker pills |
| PNG prompts (for you to generate) | 📝 | See below |

## Image generation prompts (match `hero.png` / `how/*.png` warm watercolor)

Use these filenames under `web/public/`:

1. **`mascot/wave.png`** — Kawaii mug mascot with one arm waving, warm cream + terracotta palette, soft watercolor outlines, transparent or light background, friendly eyes, no text.
2. **`mascot/confused.png`** — Same mascot tilting head, tiny sweat drop, “oops” energy, same style.
3. **`mascot/celebrate.png`** — Same mascot with sparkles / both arms up, victory pose.
4. **`mascot/asleep.png`** — Same mascot dozing on a tiny shelf, Z’s optional, cozy.
5. **`ornaments/shelf-divider.png`** — Horizontal strip: wooden shelf edge + 3 small drinkware silhouettes, flat illustration, ~1200×200px, seamless tile optional.
6. **`ornaments/price-tag.png`** — Kraft-paper price tag with string hole, empty or “$” placeholder, watercolor texture.
7. **`ornaments/sold-stamp.png`** — Circular “REHOMED” / “SOLD” rubber-stamp look, terracotta ink on cream.
8. **`bg/late-night.png`** — Subtle dark teal paper grain + faint mug constellations, tileable, low contrast (for optional dark hero backgrounds).

Until added, the UI falls back to existing `/hero.png` and SVG primitives.

| Hydration: `suppressHydrationWarning` on `<html>` + stable date formatting | ✅ | Theme script sets `data-theme` before hydrate; `formatDate.ts` for client UI |
| Display type: Fraunces (hero) | ✅ | Replaced Bagel Fat One — readable soft serif, `.t-hero` tuned (700, looser line-height) |
| `RehomedStamp` overlay (illo) | ✅ | Flea-market slap-on sticker (terracotta + cream, hard 2px border, sticker shadow, off-axis), italic Fraunces "Rehomed" + scribble underline + corner tape; matches site idiom |

**Overall: 97%** (remaining: optional new PNG assets + polish pass on edit listing if desired)
