import ScribbleUnderline from "./ScribbleUnderline";

/**
 * RehomedStamp — flea-market "slap-on" sticker overlay used when a listing is sold.
 *
 * Earlier versions read more like a passport stamp; this one matches the
 * marketplace's actual visual language:
 *
 *   - Hard 2px foreground border + 4px offset sticker shadow (`shadow-sticker`)
 *   - Accent (terracotta / coral) ground with cream ink — same idiom as the
 *     hero "for one too many." pill on the home page
 *   - Off-axis rotation, like a yard-sale price sticker
 *   - Mono eyebrow + Fraunces serif word + scribble underline + tiny caption
 *   - Masking tape strips at the corners on the large variant, so it reads as
 *     literally stuck onto the photo
 *   - A dark wash + halftone behind it so the underlying image fades back
 *
 * Two sizes:
 *   - `sm` for `ItemCard` (compact pill, single word)
 *   - `lg` for the listing hero (full sticker with eyebrow + caption + tape)
 */

type StampSize = "sm" | "lg";

/**
 * Tape strip — a small piece of "masking tape" stuck on a corner.
 * Local to this file because its tone (cream-on-dark wash) is specific to the stamp.
 */
function CornerTape({
  className = "",
  rotate = -8,
}: {
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      aria-hidden
      className={`absolute h-4 w-16 bg-[color:var(--accent-ink)]/85 border border-[color:var(--foreground)]/30 shadow-paper ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  );
}

/**
 * Render a Rehomed flea-market sticker overlay.
 *
 * @param size      Visual size — `sm` for cards, `lg` for the listing hero.
 * @param className Additional classes for the outer absolute layer.
 */
export default function RehomedStamp({
  size = "sm",
  className = "",
}: {
  size?: StampSize;
  className?: string;
}) {
  if (size === "sm") return <SmallSticker className={className} />;
  return <LargeSticker className={className} />;
}

/**
 * Compact pill for `ItemCard`. Single word, generous tracking, no extras —
 * keeps cards readable at small sizes.
 */
function SmallSticker({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 header-halftone opacity-40 mix-blend-overlay" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="px-4 py-1.5 bg-[color:var(--accent)] text-[color:var(--accent-ink)] border-2 border-[color:var(--foreground)] shadow-sticker rounded-md"
          style={{
            transform: "rotate(-4deg)",
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 700,
            fontSize: "1.5rem",
            lineHeight: 1,
            letterSpacing: "0.04em",
            fontStyle: "italic",
          }}
        >
          Rehomed
        </div>
      </div>
    </div>
  );
}

/**
 * Full sticker for the listing hero — eyebrow, big italic serif headline,
 * scribble underline, caption, and corner tape strips.
 */
function LargeSticker({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="absolute inset-0 header-halftone opacity-40 mix-blend-overlay" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className="relative bg-[color:var(--accent)] text-[color:var(--accent-ink)] border-2 border-[color:var(--foreground)] shadow-sticker rounded-xl px-6 sm:px-8 py-5 sm:py-6 max-w-[20rem] sm:max-w-sm"
          style={{ transform: "rotate(-4deg)" }}
        >
          <CornerTape className="-top-2 -left-3" rotate={-10} />
          <CornerTape className="-bottom-2 -right-3" rotate={-10} />

          <div
            className="mono font-bold uppercase text-[10px] sm:text-[11px] text-center"
            style={{ letterSpacing: "0.28em", opacity: 0.85 }}
          >
            ★ Gulp · One Too Many ★
          </div>

          <div
            className="text-center mt-1 sm:mt-1.5"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontWeight: 700,
              fontStyle: "italic",
              fontSize: "clamp(2.25rem, 5vw, 3rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
            }}
          >
            Rehomed
          </div>

          <div className="mx-auto mt-1 w-40 sm:w-48 text-[color:var(--accent-ink)]/80">
            <ScribbleUnderline className="text-[color:var(--accent-ink)]/80" />
          </div>

          <div
            className="mono text-center text-[10px] sm:text-[11px] mt-1.5"
            style={{ letterSpacing: "0.18em", opacity: 0.85 }}
          >
            found a new cupboard
          </div>
        </div>
      </div>
    </div>
  );
}
