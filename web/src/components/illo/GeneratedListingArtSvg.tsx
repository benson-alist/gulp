"use client";

import { forwardRef, useMemo } from "react";
import type { DrinkwareType } from "@/lib/api";
import { mixHex } from "@/lib/cupColorUtils";
import {
  artSlotTopLeft,
  computeArtStickerPlacements,
} from "@/lib/listingArtPlacements";
import { pickCuratedPalette } from "@/lib/listingArtPalettes";
import DrinkwareSilhouette from "./DrinkwareSilhouette";
import type { MotifPalette } from "./MotifSticker";
import { MotifStickerSvgBody } from "./MotifSticker";
import type { StickerTone } from "./stickerTones";

const VIEW_W = 400;
const VIEW_H = 320;
const HALFTONE_STEP = 20;

export type GeneratedListingArtSvgProps = {
  seed: number;
  drinkware: DrinkwareType;
  /** Resolved colours from {@link snapshotListingArtTheme}. */
  palette: MotifPalette;
  toneHex: Record<StickerTone, string>;
};

/**
 * Single SVG scene: scrapbook gradient, halftone texture, vector drinkware,
 * and 1–4 motif decals — rasterized client-side then uploaded as a normal
 * listing photo.
 */
const GeneratedListingArtSvg = forwardRef<
  SVGSVGElement,
  GeneratedListingArtSvgProps
>(function GeneratedListingArtSvg({ seed, drinkware, palette, toneHex }, ref) {
  const gradId = useMemo(() => `gulp-art-grad-${seed}`, [seed]);
  const shadowId = useMemo(() => `gulp-art-shadow-${seed}`, [seed]);

  const { curated, placements, halftoneColor, halftoneOpacity } = useMemo(() => {
    const c = pickCuratedPalette(seed);
    const ht =
      c.mood === "light"
        ? mixHex(palette.stroke, "#ffffff", 0.52)
        : mixHex(palette.stroke, "#1a1a1a", 0.18);
    const ho = c.mood === "light" ? 0.1 : 0.16;
    return {
      curated: c,
      placements: computeArtStickerPlacements(seed, { baseSize: 56 }),
      halftoneColor: ht,
      halftoneOpacity: ho,
    };
  }, [seed, palette.stroke]);

  const dots = useMemo(() => {
    const out: { cx: number; cy: number; key: string }[] = [];
    let i = 0;
    for (let y = HALFTONE_STEP / 2; y < VIEW_H; y += HALFTONE_STEP) {
      for (let x = HALFTONE_STEP / 2; x < VIEW_W; x += HALFTONE_STEP) {
        const ox = (i % 3) * 0.8;
        out.push({ cx: x + ox, cy: y + ox, key: `${x}-${y}` });
        i += 1;
      }
    }
    return out;
  }, []);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={VIEW_W}
      height={VIEW_H}
      role="img"
      aria-label="Auto-generated listing illustration"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={curated.bgA} />
          <stop offset="100%" stopColor={curated.bgB} />
        </linearGradient>
        <filter
          id={shadowId}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
        >
          <feDropShadow
            dx="1.8"
            dy="2.8"
            stdDeviation="1.35"
            floodColor={palette.stroke}
            floodOpacity="0.34"
          />
        </filter>
      </defs>

      <rect width="100%" height="100%" fill={`url(#${gradId})`} />

      <g opacity={halftoneOpacity}>
        {dots.map((d) => (
          <circle
            key={d.key}
            cx={d.cx}
            cy={d.cy}
            r={1.25}
            fill={halftoneColor}
          />
        ))}
      </g>

      <g transform="translate(100, 42)">
        <DrinkwareSilhouette
          defsIdPrefix={`cup-${seed}`}
          drinkware={drinkware}
          fill={curated.cup}
          stroke={palette.stroke}
          accent={curated.accent}
        />
      </g>

      {placements.map((p, idx) => {
        const { x, y } = artSlotTopLeft(p.slot, p.size, VIEW_W, VIEW_H);
        const tint = toneHex[p.tone];
        const cx = x + p.size / 2;
        const cy = y + p.size / 2;
        const sc = p.size / 48;
        return (
          <g
            key={`${p.kind}-${idx}`}
            transform={`translate(${cx}, ${cy}) rotate(${p.rotate}) scale(${sc}) translate(-24, -24)`}
            filter={`url(#${shadowId})`}
          >
            <MotifStickerSvgBody kind={p.kind} tint={tint} palette={palette} />
          </g>
        );
      })}
    </svg>
  );
});

export default GeneratedListingArtSvg;
