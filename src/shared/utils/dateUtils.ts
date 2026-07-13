/**
 * Centralized date utilities. No module should call `new Date()` math for
 * expiry/compliance logic directly — always go through here, so the
 * Compliance Engine (services/rules) and any UI countdown stay consistent.
 * Future Hijri/Gregorian support (Localization Policy) plugs in here only.
 */
export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function isPast(date: Date, referenceDate: Date = new Date()): boolean {
  return date.getTime() < referenceDate.getTime();
}

export function formatLocalizedDate(date: Date, locale: "ar" | "en"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
