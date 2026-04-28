/**
 * Small sparkle cluster for “new” moments (inline, not full-screen confetti).
 */
export default function SparkleBurst({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 2 L15 10 L22 8 L16 14 L22 20 L15 18 L14 26 L13 18 L6 20 L12 14 L6 8 L13 10 Z"
        fill="var(--ink-mustard)"
        opacity="0.9"
      />
      <circle cx="6" cy="6" r="1.5" fill="var(--ink-blush)" />
      <circle cx="22" cy="20" r="1.2" fill="var(--ink-sky)" />
    </svg>
  );
}
