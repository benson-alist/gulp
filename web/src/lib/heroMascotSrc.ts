/**
 * Public URL for the home hero mascot raster (under ``web/public/``).
 *
 * - Default: ``/hero.png`` (current shelf illustration).
 * - For a wider, less crowded composition, add ``hero-wide.png`` and either set
 *   ``NEXT_PUBLIC_HERO_MASCOT_SRC=/hero-wide.png`` or change the fallback below.
 *
 * @see REDESIGN_PROGRESS.md — PNG prompt for ``hero-wide.png``.
 */
export const HERO_MASCOT_PUBLIC_SRC: string =
  (typeof process.env.NEXT_PUBLIC_HERO_MASCOT_SRC === "string" &&
    process.env.NEXT_PUBLIC_HERO_MASCOT_SRC.trim()) ||
  "/hero.png";
