"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { Role, RewardCategory } from "@prisma/client";
import { createNotification } from "@/services/notifications/create";
import {
  redeemRewardSchema,
  type RedeemRewardInput,
  profileBadgeMetadataSchema,
  featureBoostMetadataSchema,
  commissionDiscountMetadataSchema,
} from "@/schemas/rewards.schema";

/**
 * Spends points on a catalog item — never cash, never a real-money
 * cash-out, matching the platform's internal-points-only design. Every
 * category is handled inside one `$transaction` alongside the point debit
 * so a redemption can never be charged without its effect applying (or
 * vice versa).
 */
export async function redeemRewardAction(input: RedeemRewardInput) {
  const user = await assertUser();
  const parsed = redeemRewardSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid reward." };

  const reward = await db.rewardItem.findUnique({ where: { id: parsed.data.rewardItemId } });
  if (!reward || !reward.isActive) return { success: false, message: "This reward is no longer available." };

  if (reward.category === RewardCategory.FEATURE_BOOST || reward.category === RewardCategory.COMMISSION_DISCOUNT) {
    if (!user.roles.includes(Role.SELLER)) {
      return { success: false, message: "This reward is only available to sellers." };
    }
  }

  if (reward.category === RewardCategory.PROFILE_BADGE) {
    const metadata = profileBadgeMetadataSchema.safeParse(reward.metadata);
    if (!metadata.success) return { success: false, message: "This reward is misconfigured." };
    const alreadyOwned = await db.userBadge.findFirst({
      where: { userId: user.id, badge: { key: metadata.data.badgeKey } },
    });
    if (alreadyOwned) return { success: false, message: "You already own this badge." };
  }

  try {
    await db.$transaction(async (tx) => {
      const debited = await tx.user.updateMany({
        where: { id: user.id, pointsBalance: { gte: reward.pointsCost } },
        data: { pointsBalance: { decrement: reward.pointsCost } },
      });
      if (debited.count === 0) throw new Error("INSUFFICIENT_POINTS");

      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { pointsBalance: true } });

      await tx.pointTransaction.create({
        data: {
          userId: user.id,
          type: "REWARD_REDEMPTION",
          amount: -reward.pointsCost,
          balanceAfter: updatedUser.pointsBalance,
          description: `Redeemed: ${reward.name}`,
        },
      });

      let expiresAt: Date | undefined;

      if (reward.category === RewardCategory.PROFILE_BADGE) {
        const metadata = profileBadgeMetadataSchema.parse(reward.metadata);
        const badge = await tx.badge.findUnique({ where: { key: metadata.badgeKey } });
        if (!badge) throw new Error("BADGE_NOT_FOUND");
        await tx.userBadge.create({ data: { userId: user.id, badgeId: badge.id } });
      } else if (reward.category === RewardCategory.FEATURE_BOOST) {
        const metadata = featureBoostMetadataSchema.parse(reward.metadata);
        const startAt = new Date();
        expiresAt = new Date(startAt.getTime() + metadata.boostDays * 24 * 60 * 60 * 1000);
        await tx.featuredCreator.create({
          data: { sellerId: user.id, startAt, endAt: expiresAt, createdById: user.id },
        });
      } else if (reward.category === RewardCategory.COMMISSION_DISCOUNT) {
        const metadata = commissionDiscountMetadataSchema.parse(reward.metadata);
        expiresAt = new Date(Date.now() + metadata.days * 24 * 60 * 60 * 1000);
        await tx.user.update({
          where: { id: user.id },
          data: { commissionDiscountPercent: metadata.discountPercent, commissionDiscountUntil: expiresAt },
        });
      }

      await tx.rewardRedemption.create({
        data: { userId: user.id, rewardItemId: reward.id, expiresAt },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return { success: false, message: "You don't have enough points for this reward." };
    }
    console.error("[rewards/redeem] failed", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  await createNotification({
    userId: user.id,
    type: "REWARD_REDEEMED",
    title: "Reward redeemed",
    body: `You redeemed "${reward.name}".`,
  }).catch((error) => console.error("[rewards/redeem] notification failed", error));

  revalidatePath("/buyer/dashboard/rewards");
  revalidatePath("/seller/dashboard/rewards");
  return { success: true };
}
