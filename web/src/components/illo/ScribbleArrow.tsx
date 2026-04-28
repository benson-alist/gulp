/**
 * Hand-drawn arrow SVG for connecting steps / CTAs. Themed via ``currentColor``.
 */
export default function ScribbleArrow({
  className = "",
  flip,
}: {
  className?: string;
  /** When true, mirror horizontally (point left). */
  flip?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M4 22 C 28 8, 52 32, 76 18 S 100 12, 108 20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M98 12 L 112 20 L 102 30"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
