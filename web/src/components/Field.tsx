import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  /** When set, the label is a ``<label htmlFor={id}>`` for the control. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Consistent label + optional hint/error for form controls.
 */
export default function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = "",
}: FieldProps) {
  const labelCls = "mono text-[10px] uppercase text-[color:var(--muted)]";
  return (
    <div className={`grid gap-1 ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelCls}>
          {label}
        </label>
      ) : (
        <span className={labelCls}>{label}</span>
      )}
      {children}
      {error ? (
        <span role="alert" className="text-sm text-[color:var(--danger)] mono">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-[color:var(--muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
