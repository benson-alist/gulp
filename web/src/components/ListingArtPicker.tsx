"use client";

import { forwardRef, useLayoutEffect, useMemo, useState } from "react";
import GeneratedListingArtSvg from "@/components/illo/GeneratedListingArtSvg";
import type { DrinkwareType } from "@/lib/api";
import { hashListingArtSeed } from "@/lib/listingArtSeed";
import { snapshotListingArtTheme } from "@/lib/listingArtTheme";

export type ListingArtPickerProps = {
  drinkwareType: DrinkwareType;
  title: string;
  /** Increment with a “Shuffle” button to re-roll layout while drafting. */
  shuffleKey: number;
};

/**
 * Live preview of the auto listing cover. The forwarded ref points at the
 * inner {@link SVGSVGElement} so parents can rasterize + upload it.
 */
const ListingArtPicker = forwardRef<SVGSVGElement, ListingArtPickerProps>(
  function ListingArtPicker({ drinkwareType, title, shuffleKey }, ref) {
    const [theme, setTheme] = useState<ReturnType<
      typeof snapshotListingArtTheme
    > | null>(null);

    useLayoutEffect(() => {
      setTheme(snapshotListingArtTheme());
    }, [drinkwareType, title, shuffleKey]);

    const seed = useMemo(
      () =>
        hashListingArtSeed(
          `${title || " "}\0${drinkwareType}\0${shuffleKey}`,
        ),
      [title, drinkwareType, shuffleKey],
    );

    if (!theme) {
      return (
        <div
          className="aspect-[5/4] w-full max-w-[280px] rounded-xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--card)] animate-pulse"
          aria-hidden
        />
      );
    }

    return (
      <div className="relative w-full max-w-[280px] rounded-xl overflow-hidden border-2 border-[color:var(--foreground)] shadow-sticker bg-[color:var(--card)]">
        <div className="aspect-[5/4] w-full [&>svg]:size-full [&>svg]:block">
          <GeneratedListingArtSvg
            ref={ref}
            seed={seed}
            drinkware={drinkwareType}
            palette={theme.palette}
            toneHex={theme.toneHex}
          />
        </div>
      </div>
    );
  },
);

export default ListingArtPicker;
