# Generated listing art — implementation progress

| Step | Status |
|------|--------|
| API: `cover_is_generated` column + Alembic + Pydantic | ✅ Done |
| Motif palette + `MotifStickerSvgBody` for raster-safe SVG | ✅ Done |
| `DrinkwareSilhouette` + `GeneratedListingArtSvg` + placements lib | ✅ Done |
| `rasterizeSvgToPng` + `ListingArtPicker` | ✅ Done |
| Sell + Edit forms (replace stock picker, upload PNG) | ✅ Done |
| Browse / detail: skip `MotifFlock` when cover is generated | ✅ Done |
| Curated `listingArtPalettes` + wire into `GeneratedListingArtSvg` | ✅ Done |
| Nine illustrated `cups/*Illo` components + dispatcher `DrinkwareSilhouette` | ✅ Done |
| `npm run lint` + `npm run build` | ✅ Done |

**Overall: 100%**

## Notes

- Background gradient + cup body + accent come from `pickCuratedPalette(seed)` (`web/src/lib/listingArtPalettes.ts`). Motif sticker tints still use `toneHex` from the live theme.
- Cup art is split under `web/src/components/illo/cups/` and mapped in `CUP_ILLOS`.
- Cup + decal shadows use `feDropShadow` with softer blur/opacity than the previous hard offset look.
