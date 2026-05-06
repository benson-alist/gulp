/**
 * Locale- and timezone-stable date formatting for text shown inside Client
 * Components. ``toLocaleDateString()`` without a fixed locale/timezone can
 * differ between Node (SSR) and the browser and trigger hydration warnings.
 */

const LOCALE = "en-US";

/**
 * Calendar date in UTC, e.g. ``Apr 28, 2026`` — good for bid rows and listing copy.
 */
export function formatCalendarDateUTC(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/**
 * Month and year in UTC, e.g. ``Apr 2026`` — compact profile line.
 */
export function formatMonthYearUTC(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
