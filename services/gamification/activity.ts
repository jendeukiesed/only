import "server-only";
import { db } from "@/lib/db/prisma";

/** Truncates to the UTC calendar date (midnight), matching ActivityLog's
 *  `@db.Date` column and the daily-streak cron's own UTC day boundaries —
 *  everything in this feature agrees on the same definition of "a day". */
function utcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Records that a user did something streak-worthy today. Called from
 * login (lib/auth/auth.ts), a successful mystery unlock
 * (actions/marketplace/unlock.ts), and a successful photo upload
 * (actions/seller/upload.ts) — any of the three counts toward the same
 * daily streak, matching `app/api/cron/daily-streak`'s use of
 * `User.lastActiveDate`.
 *
 * `upsert` with an empty `update` is the idiomatic "insert if not exists,
 * otherwise no-op" — a user who both logs in and unlocks a photo on the
 * same day should only ever get one ActivityLog row for that day, which
 * the `@@unique([userId, date])` constraint on the table guarantees even
 * under concurrent calls.
 */
export async function recordDailyActivity(userId: string): Promise<void> {
  const today = utcDateOnly(new Date());
  await db.activityLog.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });
}

/** Last `days` calendar days (oldest first) with a boolean for whether the
 *  user had a logged activity that day — the data the streak calendar
 *  component renders directly. */
export async function getActivityCalendar(userId: string, days = 30): Promise<Array<{ date: Date; active: boolean }>> {
  const today = utcDateOnly(new Date());
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const logs = await db.activityLog.findMany({
    where: { userId, date: { gte: start, lte: today } },
    select: { date: true },
  });
  const activeDates = new Set(logs.map((l) => l.date.toISOString().slice(0, 10)));

  const calendar: Array<{ date: Date; active: boolean }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    calendar.push({ date: d, active: activeDates.has(d.toISOString().slice(0, 10)) });
  }
  return calendar;
}
