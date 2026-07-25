"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { checkAndUnlockAchievements } from "@/services/gamification/achievements";
import { awardXp } from "@/services/gamification/xp";
import { recordDailyActivity } from "@/services/gamification/activity";
import { recordSeasonActivity } from "@/services/gamification/season";
import { grantReferralBonusIfEligible } from "@/services/referrals/grant-bonus";

const DEFAULT_COMMISSION_PERCENT = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 20);
const UNLOCK_XP_REWARD = 10;

async function getPlatformCommissionPercent(): Promise<number> {
  const setting = await db.platformSetting.findUnique({ where: { key: "platform_commission_percent" } });
  const value = setting?.value;
  return typeof value === "number" ? value : DEFAULT_COMMISSION_PERCENT;
}

/** The platform default, reduced by a seller's active COMMISSION_DISCOUNT
 *  reward redemption (see actions/rewards/redeem.ts), if any — never goes
 *  below 0. A discount is a temporary, timed effect (`commissionDiscountUntil`),
 *  so an expired one is silently ignored rather than needing its own
 *  cleanup job. */
async function getEffectiveCommissionPercent(sellerId: string): Promise<number> {
  const [platformPercent, seller] = await Promise.all([
    getPlatformCommissionPercent(),
    db.user.findUnique({
      where: { id: sellerId },
      select: { commissionDiscountPercent: true, commissionDiscountUntil: true },
    }),
  ]);

  const hasActiveDiscount = seller?.commissionDiscountUntil && seller.commissionDiscountUntil > new Date();
  const discount = hasActiveDiscount ? seller!.commissionDiscountPercent : 0;
  return Math.max(0, platformPercent - discount);
}

/**
 * The core mystery-unlock mutation: a buyer spends points, a specific
 * photo (already chosen — the "mystery" is that the buyer only saw the
 * blurred card, not which exact photo they'd get from that tier/listing)
 * is revealed, the seller is credited minus platform commission, and every
 * point movement is recorded as an immutable PointTransaction row.
 *
 * Race-safety: the buyer's balance decrement is a conditional
 * `updateMany` (`WHERE pointsBalance >= price`) inside the transaction, so
 * two concurrent unlock attempts can't both succeed against a balance that
 * only covers one of them.
 */
export async function unlockPhotoAction(photoId: string) {
  const buyer = await assertRole(Role.BUYER);

  const photo = await db.photo.findUnique({
    where: { id: photoId },
    select: { id: true, price: true, sellerId: true, title: true, status: true },
  });

  if (!photo || photo.status !== "APPROVED") {
    return { success: false, message: "This photo is no longer available." };
  }

  if (photo.sellerId === buyer.id) {
    return { success: false, message: "You can't unlock your own upload." };
  }

  const commissionPercent = await getEffectiveCommissionPercent(photo.sellerId);
  const platformFee = Math.round((photo.price * commissionPercent) / 100);
  const sellerEarning = photo.price - platformFee;

  try {
    const { unlock: result, buyerUnlockCount } = await db.$transaction(async (tx) => {
      const debited = await tx.user.updateMany({
        where: { id: buyer.id, pointsBalance: { gte: photo.price } },
        data: { pointsBalance: { decrement: photo.price } },
      });

      if (debited.count === 0) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      const updatedBuyer = await tx.user.findUniqueOrThrow({ where: { id: buyer.id }, select: { pointsBalance: true } });

      await tx.user.update({
        where: { id: photo.sellerId },
        data: { pointsBalance: { increment: sellerEarning } },
      });
      const updatedSeller = await tx.user.findUniqueOrThrow({ where: { id: photo.sellerId }, select: { pointsBalance: true } });

      const unlock = await tx.mysteryUnlock.create({
        data: {
          buyerId: buyer.id,
          photoId: photo.id,
          pointsSpent: photo.price,
          platformFee,
          sellerEarning,
        },
      });

      await tx.pointTransaction.create({
        data: {
          userId: buyer.id,
          type: "UNLOCK_SPEND",
          amount: -photo.price,
          balanceAfter: updatedBuyer.pointsBalance,
          relatedUnlockId: unlock.id,
          relatedPhotoId: photo.id,
          description: `Unlocked "${photo.title}"`,
        },
      });

      await tx.pointTransaction.create({
        data: {
          userId: photo.sellerId,
          type: "SALE_EARNING",
          amount: sellerEarning,
          balanceAfter: updatedSeller.pointsBalance,
          relatedUnlockId: unlock.id,
          relatedPhotoId: photo.id,
          description: `Sale of "${photo.title}"`,
        },
      });

      await tx.photo.update({ where: { id: photo.id }, data: { unlockCount: { increment: 1 } } });

      const buyerUnlockCount = await tx.mysteryUnlock.count({ where: { buyerId: buyer.id } });

      return { unlock, buyerUnlockCount };
    });

    // Best-effort side effects — an unlock has already committed above, so
    // a gamification/growth-feature hiccup shouldn't turn a successful
    // purchase into an error response for the buyer.
    try {
      await awardXp(buyer.id, UNLOCK_XP_REWARD);
      await checkAndUnlockAchievements(buyer.id, "unlock_count");
      await recordDailyActivity(buyer.id);
      await recordSeasonActivity(buyer.id, UNLOCK_XP_REWARD);
      await grantReferralBonusIfEligible(buyer.id, buyerUnlockCount);
    } catch (gamificationError) {
      console.error("[marketplace/unlock] gamification hook failed", gamificationError);
    }

    revalidatePath("/buyer/dashboard");
    revalidatePath("/buyer/dashboard/collection");
    revalidatePath("/marketplace");

    const unlockedPhoto = await db.photo.findUniqueOrThrow({
      where: { id: photo.id },
      select: { url: true, title: true },
    });

    return { success: true, unlockId: result.id, photoUrl: unlockedPhoto.url, photoTitle: unlockedPhoto.title };
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return { success: false, message: "You don't have enough points to unlock this photo." };
    }
    console.error("[marketplace/unlock] failed", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
