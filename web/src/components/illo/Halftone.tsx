/**
 * Absolute-positioned halftone dot layer for headers or hero backdrops.
 */
export default function Halftone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 header-halftone opacity-50 ${className}`}
      aria-hidden
    />
  );
}
