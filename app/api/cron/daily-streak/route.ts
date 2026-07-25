import { NextResponse } from "next/server";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { db } from "@/lib/db/prisma";
import { verifyCronRequest } from "@/lib/cron/verify-cron-request";
import { checkAndUnlockAchievements } from "@/services/gamification/achievements";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled once daily, shortly after midnight UTC (see
 * .github/workflows/cron.yml / the Vercel Cron config in vercel.json).
 * `User.lastActiveDate` is stamped elsewhere (login, unlock, upload — any
 * action that should count toward a streak) to "today" at the moment it
 * happens; this job's only responsibility is to look back at *yesterday*
 * and decide, per user, whether their streak continues or breaks:
 *
 *  - active yesterday  -> streakCount += 1, longestStreak tracks the max
 *  - not active yesterday, but had a streak -> streakCount resets to 0
 *
 * Deliberately per-user (not a single bulk `updateMany`) because
 * `longestStreak` depends on each user's own current `streakCount`, which
 * Prisma's `updateMany` can't reference relative to another column on the
 * same row. The user counts involved (thousands, not millions, for this
 * product) make a nightly loop like this an acceptable trade for
 * correctness over a cleverer bulk query.
 */
export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));

  const activeYesterday = await db.user.findMany({
    where: { lastActiveDate: { gte: yesterdayStart, lte: yesterdayEnd } },
    select: { id: true, streakCount: true, longestStreak: true },
  });

  let extended = 0;
  for (const user of activeYesterday) {
    const newStreak = user.streakCount + 1;
    await db.user.update({
      where: { id: user.id },
      data: { streakCount: newStreak, longestStreak: Math.max(user.longestStreak, newStreak) },
    });
    extended++;
    try {
      await checkAndUnlockAchievements(user.id, "streak");
    } catch (error) {
      console.error(`[cron/daily-streak] achievement check failed for user ${user.id}`, error);
    }
  }

  const { count: reset } = await db.user.updateMany({
    where: {
      lastActiveDate: { lt: yesterdayStart },
      streakCount: { gt: 0 },
    },
    data: { streakCount: 0 },
  });

  return NextResponse.json({ ok: true, extended, reset, ranAt: now.toISOString() });
}
