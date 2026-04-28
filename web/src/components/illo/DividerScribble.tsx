/**
 * Hand-drawn horizontal rule for between sections.
 */
export default function DividerScribble({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`py-6 ${className}`} aria-hidden>
      <svg
        viewBox="0 0 400 8"
        className="w-full max-w-md mx-auto h-2 text-[color:var(--muted)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 5 C 60 1, 120 8, 180 4 S 300 2, 398 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
