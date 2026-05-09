import type { ComponentType } from "react";
import type { DrinkwareType } from "@/lib/api";
import type { CupIlloProps } from "./types";
import { GlassIllo } from "./GlassIllo";
import { MugIllo } from "./MugIllo";
import { NoveltyIllo } from "./NoveltyIllo";
import { PintGlassIllo } from "./PintGlassIllo";
import { ShotGlassIllo } from "./ShotGlassIllo";
import { TravelMugIllo } from "./TravelMugIllo";
import { TumblerIllo } from "./TumblerIllo";
import { WaterBottleIllo } from "./WaterBottleIllo";
import { WineGlassIllo } from "./WineGlassIllo";

/**
 * One illustrated cup component per API drinkware enum value.
 */
export const CUP_ILLOS: Record<
  DrinkwareType,
  ComponentType<CupIlloProps>
> = {
  mug: MugIllo,
  glass: GlassIllo,
  wine_glass: WineGlassIllo,
  pint_glass: PintGlassIllo,
  water_bottle: WaterBottleIllo,
  shot_glass: ShotGlassIllo,
  travel_mug: TravelMugIllo,
  tumbler: TumblerIllo,
  novelty: NoveltyIllo,
};

export type { CupIlloProps } from "./types";
