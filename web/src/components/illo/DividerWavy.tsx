/**
 * Full-width wavy section divider (SVG).
 */
export default function DividerWavy({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`} aria-hidden>
      <svg
        viewBox="0 0 1200 24"
        className="w-full h-6 text-[color:var(--border)]"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 12 Q 150 0 300 12 T 600 12 T 900 12 T 1200 12 L 1200 24 L 0 24 Z"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
