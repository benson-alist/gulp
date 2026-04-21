# Gulp — Image Prompt Library

Practical prompt-engineering guide for generating Gulp's visual assets
(logo, listings, hero, illustrations, avatars, icons, textures).

All templates below have the **warm-thrift palette** baked in — the same
palette shipping in `web/src/app/globals.css`. Paste the Brand DNA block
into every prompt, then append the asset-specific section.

> Keep this file current. When you regenerate a single asset six months
> from now, the lighting, surface, and hexes have to match the set you
> already shipped, or the catalog drifts.

---

## The universal recipe

Every image prompt should answer these questions in this order. Skip one
and the model improvises, and your set stops looking like a set.

1. **Subject** — what's literally in the frame
2. **Composition** — how it's framed (centered, flat-lay, hero angle)
3. **Style / medium** — photo, illustration, vector, watercolor
4. **Lighting** — direction, softness, time of day
5. **Palette** — exact hex values or named colors
6. **Background** — surface and what's behind the subject
7. **Technical** — aspect ratio, resolution, negative prompts

---

## Brand DNA block (paste into every prompt)

```
Brand: Gulp, a flea-market marketplace for drinkware people are trying to
get rid of. Aesthetic: warm, honest, slightly humorous, a little lived-in.
NOT sleek sneaker-marketplace energy. Think: a thoughtful specialty cafe
at 9am meets grandma's china cabinet — unglazed ceramic, worn copper,
oat-milk morning light.

Palette (use these exactly, nothing else):
  cream:       #f2ead8  — warm unglazed ceramic, primary background
  deep teal:   #1f3b37  — forest-teal, primary ink / foreground / mugs
  sage:        #8ea87a  — muted olive sage, secondary accent / steam, foliage
  terracotta:  #c26b4e  — warm rust, primary CTA / pop color
  porcelain:   #fbf5e7  — lighter cream, card surfaces and raised panels
  oat border:  #e3d9bf  — warm beige, hairline borders and dividers
  latte muted: #7a6f5a  — warm grey-brown, captions and metadata

Usage rules:
  - Backgrounds: cream on large surfaces, porcelain on cards.
  - Text: deep teal for primary, latte muted for secondary captions.
  - Accents: terracotta for warm "buy/claim" CTAs, sage for calm/organic
    accents (steam, leaves, success states). Don't mix both on the same
    object.
  - Monochrome marks: deep teal on cream, or cream on any of the three
    color backgrounds (teal, sage, terracotta).

Lighting: soft, diffused, morning window light from the left, warm
temperature (~3500K), gentle shadows, no harsh highlights.

Materials: unglazed ceramic, matte stoneware, clear glass, amber glass,
brushed copper, brushed stainless steel. Avoid chrome, neon, acrylic gloss.

Mood: warm, honest, a little thrifted, zero corporate slickness.
```

---

## Per-asset prompt templates

### Logo mark

```
{BRAND DNA}

Subject: A circular logo mark for "Gulp". A stylized side-view of a
ceramic mug tilted slightly to the right, with a single drip of coffee
suspended mid-fall beneath it. The drip implies "one too many". The mark
reads instantly at 32px.

Style: flat vector, single color on transparent background, thick
confident strokes, slightly handmade feel (not perfectly geometric).
Color: solid #1f3b37 on transparent (primary). Also generate monochrome
alternates: #fbf5e7 on teal, #fbf5e7 on sage, #fbf5e7 on terracotta.

Composition: centered, generous padding inside a 1:1 square, mark occupies
~70% of the canvas.

Technical: SVG-ready flat vector, no gradients, no text, no 3D, no
photorealism, no shadows. Aspect ratio 1:1, 1024x1024.

Negative: text, letters, watermark, drop shadow, gradients, noise,
realistic rendering, rainbow colors, neon.
```

Generate 6–8 variants, pick one, then ask for the three monochrome
versions so you have a full system.

### Wordmark lockup

```
{BRAND DNA}

Subject: The word "Gulp" as a wordmark. Heavy, slightly condensed
sans-serif, warm character, small tongue-in-cheek detail: replace the
lowercase "u" interior with a small drip shape so it looks like liquid
is about to spill out.

Style: vector, flat, color #1f3b37 on #f2ead8, plus an alternate version
in #fbf5e7 on #1f3b37 for use on dark backgrounds.

Technical: 1200x400, transparent background, SVG-clean shapes.

Negative: generic sans-serifs, Comic Sans, serifs, italics, glow, bevel.
```

Critical: DALL-E and Midjourney are notoriously bad at spelling. Generate
several, pick the one where "Gulp" is actually spelled correctly, and
plan to re-draw it in Figma/Illustrator from the best AI concept.

### Favicon / app icon

```
{BRAND DNA}

Subject: The Gulp logo mark (circular, teal ceramic mug with drip),
simplified enough to read at 16x16.

Style: solid #1f3b37 on a #fbf5e7 circular background with a 2px #e3d9bf
border ring.

Composition: icon centered in a perfectly round badge with 12% padding.

Technical: 1024x1024, square, transparent corners or solid #f2ead8
background (produce both versions), no text.

Negative: small details, thin lines, text, multiple colors, gradients.
```

### OpenGraph / Twitter share card

```
{BRAND DNA}

Subject: Social share card for Gulp. Left 55% of the frame: large warm
photo of a cluttered open cupboard full of mismatched mugs, water bottles,
and shot glasses — soft-focused, shallow depth of field. Right 45%: solid
#f2ead8 panel with "Gulp" wordmark at top and the tagline "The marketplace
for one too many." in #1f3b37, with a small terracotta #c26b4e drip accent.

Composition: 2:1 widescreen, text right-aligned with ample breathing room.

Lighting: warm morning light streaming in from the left across the
cupboard shelves.

Technical: exactly 1200x630, sharp text zone, safe margins of 60px on all
sides.

Negative: stock-photo models, corporate, pristine new drinkware, glossy
studio light, AI-generated text artifacts in the tagline (leave the text
zone blank, I'll add it in Figma).
```

**Best practice**: always leave the text area blank and composite text
afterward. AI text is the single biggest giveaway.

### Listing photos (the big one)

This is where consistency matters most. Use one "template prompt" and
only change the subject line so all 30 listings look like the same
catalog.

```
{BRAND DNA}

Subject: [ONE SPECIFIC ITEM — see table below]

Composition: single object, centered, slight 15-degree angle from front
(not dead-on, not top-down), camera at subject height, subject occupies
60% of frame, generous negative space above and below.

Surface: warm linen tablecloth, color #e3d9bf, lightly wrinkled,
unmistakably a home kitchen surface (not a studio sweep).

Background: out-of-focus #f2ead8 wall, maybe a sliver of a wooden shelf
edge in the upper-right. No props, no flowers, no other drinkware.

Lighting: soft window light from the left at ~10am, warm 3500K, gentle
shadow falling to the right, no hard reflections on glass or metal.

Style: natural photograph, 50mm lens equivalent, f/4, slight film grain,
warm color grade. Feels like a thoughtful eBay listing, not a product
catalog.

Realism: show honest wear — light dust, one small visible chip or scuff,
a faint dishwasher cloud if it's glass, peeled-sticker residue if it fits
the item. NOT pristine, NOT new-in-box unless the listing specifies.

Technical: exactly 1200x1200, 1:1 square, high detail, sharp focus on
subject.

Negative: studio sweep, seamless white background, multiple objects,
human hands, brand logos (especially Stanley, Yeti, Hydro Flask, Nalgene,
Starbucks — those are trademarks), text, watermarks, glossy over-polished
product-shot look, cold blue lighting.
```

Don't try to force teal or sage into the drinkware photos themselves —
those palette colors live in the UI around the photo, not inside the
product shot. Let the real drinkware be whatever color it naturally is.

Per-listing subject lines (note the generic brand avoidance to dodge
trademark):

| Seed item | Subject line to drop in |
|---|---|
| World's Best Dad Mug | "a cream-white ceramic mug with faded black serif lettering reading generic 'Best Dad' text, one small chip on the rim, coffee stain ring around the interior" |
| Conference 2017 Mug | "a slate-grey ceramic mug with a small unreadable corporate logo, pristine condition, dust film suggesting years unused" |
| Tokyo cherry-blossom mug | "a pale pink ceramic mug with subtle cherry blossom silhouette decals, souvenir style, small 'Tokyo' text blurred" |
| Mustache mug | "a cream ceramic mug with a black mustache printed on the side, 2014-era hipster aesthetic, slightly chipped lip" |
| Hand-thrown tumbler | "a speckled moss-green stoneware tumbler, clearly handmade, slightly asymmetric walls, matte unglazed bottom" |
| Stanley-quencher style bottle | "a tall stainless steel insulated tumbler with handle and straw, rose-quartz pink color, matte finish, 40oz tall proportion. Generic, no brand markings" |
| Hydro Flask style bottle | "a 32oz wide-mouth stainless steel water bottle in pacific-blue, matte powder-coat finish, sticker residue on the side, no visible brand logo" |
| Shot glass (souvenir) | "a 1.5oz clear shot glass with red 'I heart NY' style souvenir decal (text blurred to avoid trademark), small, dust on rim" |
| Pint glass | "a 16oz imperial-shaped pint glass with faded brewery logo (generic, unreadable), slight beer-ring residue" |
| Wine glass | "a single stemmed wine glass, clear, slightly cloudy from dishwasher use, sitting alone on the linen surface" |
| Oversized wine glass | "an absurdly large stemmed wine glass the size of a small fishbowl, clear glass, novelty proportions" |
| Espresso cup | "a tiny 3oz porcelain espresso cup with a cobalt-blue rim stripe, saucer included" |
| Novelty "Okayest Boss" mug | "a white ceramic mug with black Comic Sans style printed phrase (text blurred), workplace gift energy" |
| Disney-ish souvenir mug | "a 16oz midnight-blue ceramic mug with gold star and moon decals, theme-park souvenir style, no Disney trademarks" |

Run the template prompt with the same seed (Midjourney `--seed`, Stable
Diffusion/Flux seed parameter) so lighting stays identical across the set.

### Home hero image

```
{BRAND DNA}

Subject: An open kitchen cupboard, full to bursting, crammed with at
least 15 pieces of mismatched drinkware — chipped mugs stacked sideways,
water bottles leaning, two shot glasses forgotten at the back, a single
wine glass on the wrong shelf. Cupboard door is open, warm light spilling
out.

Composition: shot straight-on, cupboard occupies right 60% of the frame,
left 40% is a clean stretch of kitchen wall in #f2ead8 for copy overlay.

Style: natural photograph, slightly wide lens (35mm equivalent), f/5.6,
shallow depth of field on the front mug, warm film-like color grade.

Lighting: morning kitchen light from the right, soft, lived-in.

Mood: relatable chaos. Should make viewers think "this is my cupboard"
and feel mildly seen.

Technical: 2000x1500, landscape 4:3, high detail.

Negative: staged catalog shot, magazine-clean, empty cupboard,
matched-set drinkware, corporate kitchen, bright overhead fluorescent
light, people.
```

### "How it works" three-step vignettes

One prompt, three runs with different subjects. Keep lighting, surface,
and palette identical so they stack with the listing catalog.

```
{BRAND DNA}

Subject: [STEP SUBJECT — see below]

Composition: simple hero shot, single focal point, centered, 1:1 square.
Same linen surface (#e3d9bf) and warm window light as the listing photos.

[Step 01 - Confess]: "a hand (just the hand, warm skin tone) jotting a
note on a small index card on the linen surface, ceramic mug visible at
the edge of frame"
[Step 02 - List]: "an open notebook beside a ceramic mug with a small
price tag reading '$' attached with twine"
[Step 03 - Rehome]: "a cardboard mailer box, slightly open, tissue paper
inside, one ceramic mug about to go in"

Technical: 1:1, 800x800 each.

Negative: faces, body beyond a hand, bright colors, clutter, phones,
screens.
```

### Empty-state illustration ("Nothing matched")

```
{BRAND DNA}

Subject: A single ceramic mug lying tipped on its side, one small puddle
of liquid pooled beside it, looking mildly sheepish. Flat vector
illustration style, unDraw-adjacent, friendly and warm.

Style: flat vector, 2-3 tone illustration, colors restricted to #1f3b37,
#c26b4e, and #e3d9bf on transparent background. Optionally add #8ea87a
as a fourth accent for the puddle or a nearby leaf. Confident outlines,
minimal detail, subtle humor.

Composition: centered, lots of negative space for the text "Nothing
matched" that I'll place below.

Technical: 480x480, transparent PNG or SVG, 1:1.

Negative: photorealism, shading, gradients, text, watermarks, complex
backgrounds, multiple colors outside the palette.
```

### 404 illustration

```
{BRAND DNA}

Subject: A ceramic mug mid-air, mid-spill — liquid arcing out in a
frozen splash, the mug itself tumbling. Captures "this cup walked off the
shelf". Flat vector, slightly playful.

Style: same flat vector language as the empty-state illustration. Same
restricted palette: #1f3b37, #c26b4e, #e3d9bf on transparent, with
#8ea87a usable for the liquid arc.

Composition: centered with motion lines, generous padding.

Technical: 600x480, transparent SVG.

Negative: photorealism, text, splatter detail beyond stylized droplets,
extra objects.
```

### Background paper-grain texture

```
{BRAND DNA}

Subject: A seamless tileable paper-grain texture in unglazed ceramic
cream. Subtle, almost invisible when tiled, just enough to add warmth.

Style: very low contrast, grain only, no visible pattern or direction, no
stains or marks.

Color: dominant #f2ead8 with organic variation of +/-5% luminance, no hue
shifts beyond cream.

Technical: exactly 400x400, seamless tiling (left edge matches right,
top matches bottom), PNG with transparency baked against #f2ead8.

Negative: visible motifs, lines, directional grain, dark spots, strong
contrast, colors other than cream.
```

### Seller avatar set

```
{BRAND DNA}

Subject: A set of 10 illustrated character avatars, one per persona
(dad_of_four, trendy_tessa, karen_abroad, brewery_bill,
office_swag_pile, hydration_stan, grandma_s_estate, impulse_ian,
wine_mom_wendy, ceramics_major). Each is a simple shoulders-up portrait
with a distinct silhouette: Dad has a baseball cap, Tessa has a tumbler
tucked under her arm, Karen has sunglasses pushed up, Bill has a beard
and flannel collar, etc.

Style: flat vector, warm muted palette, consistent line weight, friendly
faces, zero gradients. Humaaans / Notion-avatar adjacent.

Colors: each avatar uses 3-4 colors chosen from the brand palette plus
one skin tone. Background is a solid circle cycling through #f2ead8,
#e3d9bf, #8ea87a, and a muted #c26b4e for variety.

Technical: 10 images, 512x512 each, 1:1 square, transparent background
plus the solid colored circle.

Negative: photorealism, detailed facial features, text, captions, name
labels, inconsistent style between the 10.
```

Avatar sets are hard to keep consistent across 10 generations. Midjourney
`--cref` (character reference) or generating all 10 in one composite
image then splitting works better than 10 separate prompts.

### Acquisition-source stamps

```
{BRAND DNA}

Subject: Six rubber-stamp-style SVG icons, one for each acquisition
source: GIFT (a wrapped present box), TREND (a trending-up arrow),
CONFERENCE (a lanyard), SOUVENIR (a tiny globe), INHERITED (a
picture-frame), IMPULSE_BUY (a shopping bag).

Style: solid rubber-stamp look with slightly imperfect inked edges,
monochrome #1f3b37 on transparent (primary). Also generate a highlighted
variant of the full set in #c26b4e for hover/active states. Label text
above the icon in a condensed sans-serif.

Technical: 6 SVGs per variant, each 256x256, transparent. Consistent
stroke weight and frame style across all 6 (same circular or hexagonal
outline).

Negative: color photography, gradients, multiple colors, inconsistent
framing between the 6 icons.
```

---

## Tool-specific syntax cheatsheet

**Midjourney v6:**
```
[prompt] --ar 1:1 --style raw --s 250 --v 6
```
Use `--style raw` for photography, drop it for illustration. `--seed <n>`
locks the random seed so you can iterate consistently. `--cref <url>`
references a subject across multiple generations. `--sref <url>` pins the
style.

**DALL-E 3 (ChatGPT):**
Talk to it in prose. It rewrites your prompt internally, so explicitly
say `I want the literal prompt to be used without rewriting` if you need
precision. Best at following palette instructions, worst at spelling.

**Stable Diffusion / Flux:**
```
Prompt: [prompt]
Negative: [negative prompt]
CFG: 7-9 for photography, 5-7 for illustration
Steps: 30-40
Sampler: DPM++ 2M Karras (SD) or default (Flux)
Seed: <fixed number for consistency across set>
```

**Nano Banana / Gemini 2.5 image / Imagen 4:**
```
aspect_ratio: "1:1" | "16:9" | "4:3"
```
Plain English, handles palette instructions well.

**ChatGPT's image tool / GPT-Image-1:**
Plain English, supports `size: "1024x1024" | "1792x1024" | "1024x1792"`.

---

## Consistency tactics

1. **Fix the seed** for an entire catalog set (Midjourney `--seed`,
   SD/Flux seed parameter). Lighting and color stay identical.
2. **Generate a "style reference" image first** (the template
   linen-on-morning-kitchen scene with no subject), then reuse it via
   `--sref` (Midjourney), IP-Adapter (SD), or as a description in every
   subsequent prompt.
3. **Batch by category.** Generate all 9 mugs in one session with
   identical non-subject wording. Do not come back a week later and
   generate mug #10 with a slightly different prompt.
4. **Color-match after the fact.** Even with the palette baked into the
   prompt, AI drifts. Run final images through a Lightroom preset, VSCO
   recipe, or Photoshop "match color" against a reference image.
5. **Leave text zones blank** and add text in Figma/Illustrator
   afterward. Non-negotiable.

---

## Universal negative prompt (copy into every generation)

```
AI artifacts, extra fingers, extra handles, duplicate objects, warped
geometry, text, watermarks, signatures, copyrighted brand logos,
Stanley logo, Yeti logo, Hydro Flask logo, Starbucks logo, Disney logo,
Nike, corporate stock-photo, model release faces, plastic glossy shine,
blue studio light, sweep background, cold color temperature, HDR,
oversaturated.
```

---

## Recommended workflow

1. Spend 30 min nailing down **one** listing photo you love. That
   becomes your style reference.
2. Generate the remaining 29 in one batch with the same seed and style
   reference. Cull aggressively — expect 30% keep rate.
3. Do the logo last, not first. The catalog defines the brand feel; the
   logo should match what's already working, not the other way around.
4. Always generate 4x as many as you need. Cheaper than re-prompting.
5. When you ship a final asset, update this file with the exact prompt,
   seed, tool version, and output filename so future-you can regenerate
   a single missing asset and the lighting still matches.

---

## Palette quick-reference (matches `web/src/app/globals.css`)

| Token | Hex | Role |
|---|---|---|
| cream | `#f2ead8` | primary background, large surfaces |
| deep teal | `#1f3b37` | primary ink / foreground |
| sage | `#8ea87a` | organic accent, success states |
| terracotta | `#c26b4e` | primary CTA, warm pop |
| porcelain | `#fbf5e7` | card surfaces, raised panels |
| oat border | `#e3d9bf` | hairline borders, dividers |
| latte muted | `#7a6f5a` | captions, metadata |
| deep rust | `#8c3b2a` | errors, destructive states |
