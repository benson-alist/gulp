import type { ReactNode } from "react";

/**
 * Label + value pair for hero stats and dashboards.
 */
export default function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <div className="mono text-[10px] uppercase text-[color:var(--muted)] tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-black font-sans">{value}</div>
      {hint ? (
        <div className="mono text-[10px] text-[color:var(--muted)] mt-1">{hint}</div>
      ) : null}
    </div>
  );
}
