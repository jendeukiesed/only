import "server-only";
import { db } from "@/lib/db/prisma";
import { createNotification } from "@/services/notifications/create";

/** Simple linear level curve: level N requires N * 100 cumulative XP.
 *  Deliberately simple over a tuned exponential curve — easy to rebalance
 *  later by changing this one function without touching callers. */
export function levelForXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

/** Adds XP to a user and promotes their level if they crossed a
 *  threshold, notifying them on level-up. Called after any XP-granting
 *  event (unlock, upload approval, mission/achievement completion). */
export async function awardXp(userId: string, amount: number) {
  if (amount <= 0) return;

  const user = await db.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true, level: true },
  });

  const newLevel = levelForXp(user.xp);
  if (newLevel > user.level) {
    await db.user.update({ where: { id: userId }, data: { level: newLevel } });
    await createNotification({
      userId,
      type: "LEVEL_UP",
      title: `Level ${newLevel}!`,
      body: `You've reached level ${newLevel}. Keep it up!`,
    });
  }
}
