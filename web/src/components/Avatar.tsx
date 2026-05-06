"use client";

import Image from "next/image";

type AvatarProps = {
  /** Primary line shown in listings and profile — used for initials fallback. */
  displayName: string;
  /** Public handle — second line for initials if display name is empty. */
  username: string;
  /** Absolute image URL from the API upload endpoint, or null to show initials. */
  avatarUrl: string | null | undefined;
  /** Square edge length in CSS pixels. */
  sizePx: number;
  className?: string;
};

/**
 * Rounds profile imagery: either a cropped photo or a two-letter initial disk
 * that matches the rest of the Gulp visual language.
 */
export default function Avatar({
  displayName,
  username,
  avatarUrl,
  sizePx,
  className = "",
}: AvatarProps) {
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    username.slice(0, 2).toUpperCase();

  if (avatarUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-[color:var(--card)] ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        <Image
          src={avatarUrl}
          alt={`${displayName} avatar`}
          width={sizePx}
          height={sizePx}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        fontSize: Math.max(11, Math.round(sizePx * 0.35)),
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
