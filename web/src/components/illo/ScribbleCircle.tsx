/**
 * Imperfect circular scribble for framing small icons or numbers.
 */
export default function ScribbleCircle({
  className = "text-[color:var(--foreground)]",
  size = 48,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M24 4 C 38 5, 44 16, 42 28 C 40 40, 28 46, 14 42 C 4 36, 2 22, 10 12 C 16 4, 24 4, 24 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}
