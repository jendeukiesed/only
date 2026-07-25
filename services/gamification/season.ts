import "server-only";
import { db } from "@/lib/db/prisma";
import { currentSeasonKey } from "@/lib/constants/season";

/** Bumps the buyer's current-month SeasonScore row alongside the all-time
 *  `User.xp`/unlock counters — called once per successful unlock (see
 *  actions/marketplace/unlock.ts). `xpEarned` mirrors whatever XP amount
 *  the unlock itself awarded (see services/gamification/xp.ts) so the
 *  seasonal leaderboard and the all-time one are always measuring the same
 *  underlying events, just over different windows. */
export async function recordSeasonActivity(userId: string, xpEarned: number) {
  const season = currentSeasonKey();
  await db.seasonScore.upsert({
    where: { userId_season: { userId, season } },
    update: { xpEarned: { increment: xpEarned }, unlocksCount: { increment: 1 } },
    create: { userId, season, xpEarned, unlocksCount: 1 },
  });
}
