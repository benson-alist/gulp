import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "sticker";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

const base =
  "inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-sm transition border border-transparent";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] wobble-on-tap shadow-sticker border-[color:var(--foreground)]",
  ghost:
    "border-[color:var(--foreground)] text-[color:var(--foreground)] bg-transparent hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] wobble-on-tap",
  sticker:
    "bg-[color:var(--card)] text-[color:var(--foreground)] border-[color:var(--foreground)] shadow-sticker -rotate-1 hover:rotate-0 wobble-on-tap",
};

/**
 * Primary actions use ``primary``; outline secondary uses ``ghost``;
 * playful CTAs use ``sticker`` (slight rotation + offset shadow).
 */
export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
