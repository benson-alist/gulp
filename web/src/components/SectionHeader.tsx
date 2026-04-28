"use client";

import ScribbleUnderline from "@/components/illo/ScribbleUnderline";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  /** When true, animate a scribble under the title on scroll. */
  scribble?: boolean;
  className?: string;
};

/**
 * Eyebrow (mono) + display title; optional animated scribble underline.
 */
export default function SectionHeader({
  eyebrow,
  title,
  scribble = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <div className="t-eyebrow">{eyebrow}</div>
      <h2 className="mt-1 t-display">{title}</h2>
      {scribble ? (
        <div className="mt-2 max-w-xs">
          <ScribbleUnderline />
        </div>
      ) : null}
    </div>
  );
}
