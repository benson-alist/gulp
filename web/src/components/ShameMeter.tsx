/**
 * Visual representation of a cup's self-declared character.
 *
 * Renders a 10-segment meter plus a short label. Used on listing cards
 * and detail pages to celebrate the cup's particular energy.
 */
export default function ShameMeter({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const clamped = Math.max(1, Math.min(10, Math.round(value)));
  const label = characterLabel(clamped);

  return (
    <div
      role="img"
      aria-label={`Character score ${clamped} of 10 — ${label}`}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < clamped
                ? i < 3
                  ? "bg-[#8ea87a]" // sage — subtle
                  : i < 6
                    ? "bg-[#d6a24a]" // mustard — warming up
                    : i < 8
                      ? "bg-[color:var(--accent)]" // terracotta — characterful
                      : "bg-[color:var(--danger)]" // deep rust — iconic
                : "bg-[color:var(--border)]"
            }`}
          />
        ))}
      </div>
      {!compact && (
        <div className="flex items-center justify-between mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
          <span>Character Score</span>
          <span>
            {clamped}/10 · {label}
          </span>
        </div>
      )}
    </div>
  );
}

/** Friendly label for a cup's character score. */
function characterLabel(score: number): string {
  if (score <= 2) return "quiet charm";
  if (score <= 4) return "easygoing";
  if (score <= 6) return "full of character";
  if (score <= 8) return "legendary energy";
  return "certified icon";
}
