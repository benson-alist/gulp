"use client";

import { forwardRef, useMemo } from "react";
import type { DrinkwareType } from "@/lib/api";
import {
  artSlotTopLeft,
  computeArtStickerPlacements,
  rngFrom,
} from "@/lib/listingArtPlacements";
import DrinkwareSilhouette from "./DrinkwareSilhouette";
import type { MotifPalette } from "./MotifSticker";
import { MotifStickerSvgBody } from "./MotifSticker";
import { STICKER_TONES, type StickerTone } from "./stickerTones";

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

  const { stops, cupFill, placements } = useMemo(() => {
    const rng = rngFrom(seed);
    const tA = STICKER_TONES[Math.floor(rng() * STICKER_TONES.length)];
    const tB = STICKER_TONES[Math.floor(rng() * STICKER_TONES.length)];
    const tCup =
      STICKER_TONES[Math.floor(rng() * STICKER_TONES.length)];
    return {
      stops: { a: toneHex[tA], b: toneHex[tB] },
      cupFill: toneHex[tCup],
      placements: computeArtStickerPlacements(seed, { baseSize: 56 }),
    };
  }, [seed, toneHex]);

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
          <stop offset="0%" stopColor={stops.a} />
          <stop offset="100%" stopColor={stops.b} />
        </linearGradient>
        <filter
          id={shadowId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="2.2"
            dy="2.2"
            stdDeviation="0.2"
            floodColor={palette.stroke}
            floodOpacity="1"
          />
        </filter>
      </defs>

      <rect width="100%" height="100%" fill={`url(#${gradId})`} />

      <g opacity={0.14}>
        {dots.map((d) => (
          <circle
            key={d.key}
            cx={d.cx}
            cy={d.cy}
            r={1.25}
            fill={palette.stroke}
          />
        ))}
      </g>

      <g transform="translate(100, 42)">
        <DrinkwareSilhouette
          drinkware={drinkware}
          fill={cupFill}
          stroke={palette.stroke}
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
