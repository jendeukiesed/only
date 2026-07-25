/** The current "season" key used by SeasonScore — a calendar month in UTC
 *  (e.g. "2026-07"). Monthly rather than a bespoke season length: it needs
 *  no explicit "close the season" job (a new key just starts accumulating
 *  the moment the calendar rolls over), and it matches the cadence buyers
 *  already understand from `SellerMonthlyStat`. */
export function currentSeasonKey(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function seasonLabel(season: string): string {
  const [year, month] = season.split("-").map(Number);
  if (!year || !month) return season;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
