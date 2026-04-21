/**
 * Visual representation of a seller's self-declared shame.
 *
 * Renders a 10-segment meter plus a short label. Used on listing cards and
 * detail pages to lovingly roast the cupboard owner.
 */
export default function ShameMeter({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const clamped = Math.max(1, Math.min(10, Math.round(value)));
  const label = shameLabel(clamped);

  return (
    <div
      role="img"
      aria-label={`Shame index ${clamped} of 10 — ${label}`}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < clamped
                ? i < 3
                  ? "bg-[#8ea87a]" // sage — calm, low-shame
                  : i < 6
                    ? "bg-[#d6a24a]" // mustard — warming up
                    : i < 8
                      ? "bg-[color:var(--accent)]" // terracotta — cupboard crime
                      : "bg-[color:var(--danger)]" // deep rust — intervention
                : "bg-[color:var(--border)]"
            }`}
          />
        ))}
      </div>
      {!compact && (
        <div className="flex items-center justify-between mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
          <span>Shame Index</span>
          <span>
            {clamped}/10 · {label}
          </span>
        </div>
      )}
    </div>
  );
}

/** Pick a roast-friendly label for a given shame score. */
function shameLabel(score: number): string {
  if (score <= 2) return "mildly guilty";
  if (score <= 4) return "a little shelf-aware";
  if (score <= 6) return "cupboard crime";
  if (score <= 8) return "certified hoarder";
  return "call an intervention";
}
