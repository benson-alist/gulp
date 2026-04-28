"use client";

import Link from "next/link";
import type { Item, Me, OfferWithItem } from "@/lib/api";
import { formatUSD } from "@/lib/api";
import { formatMonthYearUTC } from "@/lib/formatDate";
import Avatar from "@/components/Avatar";

type ProfileHeaderProps = {
  user: Me;
  items: Item[];
  bids: OfferWithItem[];
};

/**
 * Account summary at the top of the dashboard: avatar, identity, join date,
 * and quick stats derived from the already-fetched listings and bids.
 */
export default function ProfileHeader({
  user,
  items,
  bids,
}: ProfileHeaderProps) {
  const shelfValue = items
    .filter((i) => !i.is_sold)
    .reduce((sum, i) => sum + i.price, 0);
  const joined = formatMonthYearUTC(user.created_at);

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <Avatar
          displayName={user.display_name}
          username={user.username}
          avatarUrl={user.avatar_url}
          sizePx={80}
          className="ring-2 ring-[color:var(--border)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {user.display_name}
              {user.verified && (
                <span
                  aria-label="verified cupboard"
                  className="text-[color:var(--success)] ml-1"
                >
                  ✓
                </span>
              )}
            </h1>
          </div>
          <div className="mono text-xs text-[color:var(--muted)] mt-1">
            @{user.username} · {user.email} · Joined {joined}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/u/${user.username}`}
              className="text-xs mono uppercase tracking-wider px-3 py-1.5 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--background)] transition"
            >
              Public shelf
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        <StatPill label="Listings" value={String(items.length)} />
        <StatPill label="Bids" value={String(bids.length)} />
        <StatPill label="On shelf" value={formatUSD(shelfValue)} />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]/60 px-3 py-2 text-center">
      <div className="mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
        {label}
      </div>
      <div className="font-black text-sm sm:text-base mt-0.5 truncate">{value}</div>
    </div>
  );
}
