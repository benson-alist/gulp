import Link from "next/link";
import Image from "next/image";
import { ScribbleCircle } from "@/components/illo";

type EmptyStateProps = {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  /** Optional mascot image under ``/public`` (e.g. ``/hero.png``). */
  mascotSrc?: string;
  mascotAlt?: string;
};

/**
 * Centered empty state with optional mascot art and scribble frame.
 */
export default function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
  mascotSrc,
  mascotAlt = "",
}: EmptyStateProps) {
  return (
    <div className="relative rounded-2xl border-2 border-dashed border-[color:var(--border)] p-8 text-center bg-[color:var(--card)]/80 overflow-hidden">
      <div className="absolute -right-4 -top-4 text-[color:var(--ink-blush)] opacity-40 pointer-events-none">
        <ScribbleCircle size={72} />
      </div>
      {mascotSrc ? (
        <div className="relative w-24 h-24 mx-auto mb-3">
          <Image
            src={mascotSrc}
            alt={mascotAlt}
            width={96}
            height={96}
            className="object-contain bob"
          />
        </div>
      ) : null}
      <div className="font-bold text-lg font-sans">{title}</div>
      <div className="text-[color:var(--muted)] mt-1 text-sm max-w-md mx-auto">{body}</div>
      <Link
        href={ctaHref}
        className="inline-flex mt-5 min-h-[44px] items-center px-5 py-2.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] text-sm font-semibold transition shadow-sticker border border-[color:var(--foreground)] wobble-on-tap"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
