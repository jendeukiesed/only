import "server-only";
import { db } from "@/lib/db/prisma";
import { createNotification } from "@/services/notifications/create";
import { awardXp } from "./xp";

type CriteriaType = "unlock_count" | "approved_count" | "points_earned" | "streak" | "following_count";

/** Reads the current value of whatever an achievement's criteria measures.
 *  Add a new branch here whenever a new achievement criteria `type` is
 *  introduced in the seed data. */
async function getCurrentValue(userId: string, type: CriteriaType): Promise<number> {
  switch (type) {
    case "unlock_count":
      return db.mysteryUnlock.count({ where: { buyerId: userId } });
    case "approved_count":
      return db.photo.count({ where: { sellerId: userId, status: "APPROVED" } });
    case "points_earned": {
      const agg = await db.pointTransaction.aggregate({
        where: { userId, type: "SALE_EARNING" },
        _sum: { amount: true },
      });
      return agg._sum.amount ?? 0;
    }
    case "streak": {
      const user = await db.user.findUnique({ where: { id: userId }, select: { streakCount: true } });
      return user?.streakCount ?? 0;
    }
    case "following_count":
      return db.follow.count({ where: { followerId: userId } });
    default:
      return 0;
  }
}

/**
 * Call this after any event that could satisfy an achievement (unlock,
 * upload approval, follow, daily login) — cheap enough to run inline
 * rather than needing a background job, since it only touches a handful
 * of achievement rows per criteria type.
 */
export async function checkAndUnlockAchievements(userId: string, criteriaType: CriteriaType) {
  const [achievements, alreadyUnlocked] = await Promise.all([
    db.achievement.findMany({ where: { criteria: { path: ["type"], equals: criteriaType } } }),
    db.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  if (achievements.length === 0) return;

  const unlockedIds = new Set(alreadyUnlocked.map((a) => a.achievementId));
  const candidates = achievements.filter((a) => !unlockedIds.has(a.id));
  if (candidates.length === 0) return;

  const currentValue = await getCurrentValue(userId, criteriaType);

  for (const achievement of candidates) {
    const criteria = achievement.criteria as { type: string; target: number };
    if (currentValue < criteria.target) continue;

    await db.userAchievement.create({ data: { userId, achievementId: achievement.id } });

    if (achievement.pointsReward > 0) {
      const updated = await db.user.update({
        where: { id: userId },
        data: { pointsBalance: { increment: achievement.pointsReward } },
        select: { pointsBalance: true },
      });
      await db.pointTransaction.create({
        data: {
          userId,
          type: "ACHIEVEMENT_REWARD",
          amount: achievement.pointsReward,
          balanceAfter: updated.pointsBalance,
          description: `Achievement unlocked: ${achievement.name}`,
        },
      });
    }

    if (achievement.xpReward > 0) {
      await awardXp(userId, achievement.xpReward);
    }

    await createNotification({
      userId,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Achievement unlocked!",
      body: `${achievement.icon} ${achievement.name} — ${achievement.description}`,
    });
  }
}
