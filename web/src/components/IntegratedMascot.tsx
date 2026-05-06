import Image from "next/image";
import { forwardRef, type CSSProperties, type ReactNode } from "react";

/** Radial fade so PNG edges blend into the sticker frame (not a hard crop). */
export const MASCOT_VIGNETTE_STYLE: CSSProperties = {
  maskImage:
    "radial-gradient(ellipse 92% 90% at 50% 38%, black 12%, transparent 76%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 92% 90% at 50% 38%, black 12%, transparent 76%)",
};

type FrameProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
};

/**
 * Shared “sticker” shell for mascot PNGs: card fill, ink border, paper grain,
 * and halftone so art reads as part of the UI instead of a pasted rectangle.
 */
export const MascotIntegratedFrame = forwardRef<HTMLDivElement, FrameProps>(
  function MascotIntegratedFrame(
    { children, className = "", style, "aria-hidden": ariaHidden },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] shadow-sticker ${className}`}
        style={style}
        aria-hidden={ariaHidden}
      >
        <div
          className="pointer-events-none absolute inset-0 grain opacity-[0.28] mix-blend-multiply dark:opacity-[0.22] dark:mix-blend-soft-light"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 header-halftone opacity-[0.2] dark:opacity-[0.14]"
          aria-hidden
        />
        {children}
      </div>
    );
  },
);

export type IntegratedMascotVariant = "hero" | "auth" | "empty" | "inline";

type VariantLayout =
  | {
      kind: "fluid";
      wrap: string;
      sizes: string;
      /** Outer aspect box (e.g. 4:3 scene for home hero). */
      aspectBox: string;
      /** Inset from frame edge so art does not hug the sticker border. */
      inset: string;
      img: string;
    }
  | {
      kind: "fixed";
      wrap: string;
      sizes: string;
      img: string;
    };

const VARIANT_LAYOUT: Record<IntegratedMascotVariant, VariantLayout> = {
  hero: {
    kind: "fluid",
    wrap: "w-full max-w-[min(100%,260px)] sm:max-w-[280px] md:max-w-[300px]",
    sizes: "(min-width: 768px) 300px, min(100vw, 260px)",
    aspectBox: "relative aspect-[4/3] w-full",
    inset: "absolute inset-2 sm:inset-3",
    img: "object-contain object-center",
  },
  auth: {
    kind: "fluid",
    wrap: "w-full max-w-[180px] sm:max-w-[210px] md:max-w-[220px]",
    sizes: "(min-width: 768px) 220px, min(100vw, 210px)",
    aspectBox: "relative aspect-square w-full",
    inset: "absolute inset-2 sm:inset-2.5",
    img: "object-contain object-center",
  },
  empty: {
    kind: "fixed",
    wrap: "w-24 h-24",
    sizes: "96px",
    img: "object-cover object-[52%_36%] scale-[1.12]",
  },
  inline: {
    kind: "fixed",
    wrap: "w-14 h-14 shrink-0",
    sizes: "56px",
    img: "object-cover object-[52%_36%] scale-[1.08]",
  },
};

type IntegratedMascotProps = {
  /** Layout preset — drives max dimensions and crop bias. */
  variant: IntegratedMascotVariant;
  alt: string;
  className?: string;
  priority?: boolean;
  /**
   * Public path under ``/public``; defaults to ``/hero.png``.
   * When you add a wider illustration (e.g. ``/hero-wide.png``), pass it here
   * for ``variant="hero"`` — see ``REDESIGN_PROGRESS.md`` image prompts.
   */
  src?: string;
};

/**
 * Static mascot tile (server-safe): raster art inside ``MascotIntegratedFrame``
 * with vignette. Hero/auth use ``w-full`` + max-width so flex layouts do not
 * collapse; hero uses a 4:3 scene box with ``object-contain`` for a roomier crop.
 */
export default function IntegratedMascot({
  variant,
  alt,
  className = "",
  priority = false,
  src = "/hero.png",
}: IntegratedMascotProps) {
  const cfg = VARIANT_LAYOUT[variant];

  if (cfg.kind === "fixed") {
    return (
      <MascotIntegratedFrame className={`${cfg.wrap} ${className}`}>
        <div
          className="relative h-full min-h-0 w-full"
          style={MASCOT_VIGNETTE_STYLE}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={cfg.sizes}
            className={`${cfg.img} select-none`}
          />
        </div>
      </MascotIntegratedFrame>
    );
  }

  return (
    <MascotIntegratedFrame className={`${cfg.wrap} ${className}`}>
      <div className={cfg.aspectBox}>
        <div
          className={`${cfg.inset} relative min-h-0 overflow-hidden`}
          style={MASCOT_VIGNETTE_STYLE}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={cfg.sizes}
            className={`${cfg.img} select-none`}
          />
        </div>
      </div>
    </MascotIntegratedFrame>
  );
}
