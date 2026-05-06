/**
 * Ten-segment meter for the seller-declared **honesty index** (`shame_index` in the API):
 * how upfront the listing is about wear, dings, and quirks (1 = vague, 10 = nothing hidden).
 *
 * Used on listing cards (compact) and detail (full row label) alongside ``ShameMeterPlayful``.
 */
export default function ShameMeter({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const clamped = Math.max(1, Math.min(10, Math.round(value)));
  const label = honestyLabel(clamped);

  return (
    <div
      role="img"
      aria-label={`Honesty index ${clamped} of 10 — ${label}`}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < clamped
                ? i < 3
                  ? "bg-[#8ea87a]" // sage — light touch
                  : i < 6
                    ? "bg-[#d6a24a]" // mustard — warming up
                    : i < 8
                      ? "bg-[color:var(--accent)]" // terracotta — very clear
                      : "bg-[color:var(--danger)]" // deep rust — full disclosure
                : "bg-[color:var(--border)]"
            }`}
          />
        ))}
      </div>
      {!compact && (
        <div className="flex items-center justify-between mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
          <span>Honesty index</span>
          <span>
            {clamped}/10 · {label}
          </span>
        </div>
      )}
    </div>
  );
}

/** Short phrase for a given honesty index tier. */
function honestyLabel(score: number): string {
  if (score <= 2) return "light on detail";
  if (score <= 4) return "basics covered";
  if (score <= 6) return "straight shooter";
  if (score <= 8) return "full disclosure";
  return "nothing hidden";
}
