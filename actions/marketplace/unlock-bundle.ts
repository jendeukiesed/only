"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { awardXp } from "@/services/gamification/xp";
import { checkAndUnlockAchievements } from "@/services/gamification/achievements";
import { recordDailyActivity } from "@/services/gamification/activity";
import { recordSeasonActivity } from "@/services/gamification/season";
import { grantReferralBonusIfEligible } from "@/services/referrals/grant-bonus";
import { splitBundlePrice } from "@/services/marketplace/split-bundle-price";

const DEFAULT_COMMISSION_PERCENT = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 20);
const BUNDLE_UNLOCK_XP_REWARD = 10;

async function getPlatformCommissionPercent(): Promise<number> {
  const setting = await db.platformSetting.findUnique({ where: { key: "platform_commission_percent" } });
  const value = setting?.value;
  return typeof value === "number" ? value : DEFAULT_COMMISSION_PERCENT;
}

/**
 * The bundle equivalent of actions/marketplace/unlock.ts's core unlock
 * mutation: one buyer purchase (`BundleUnlock`) fans out into one ordinary
 * `MysteryUnlock` row per photo in the bundle, each with its own
 * proportional price/commission/earning split, inside a single
 * transaction — so collection views, seller earnings, and the point
 * ledger all read a bundle purchase exactly like N individual unlocks
 * that just happened to be bought together at a discount.
 */
export async function unlockBundleAction(bundleId: string) {
  const buyer = await assertRole(Role.BUYER);

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId },
    include: { photos: { include: { photo: { select: { id: true, price: true, sellerId: true, title: true, status: true } } } } },
  });

  if (!bundle || !bundle.isActive) {
    return { success: false, message: "This bundle is no longer available." };
  }

  const photos = bundle.photos.map((bp) => bp.photo);
  if (photos.some((p) => p.status !== "APPROVED")) {
    return { success: false, message: "One of this bundle's photos is no longer available." };
  }
  if (photos.some((p) => p.sellerId === buyer.id)) {
    return { success: false, message: "This bundle includes one of your own uploads." };
  }

  const platformPercent = await getPlatformCommissionPercent();
  const shares = splitBundlePrice(bundle.price, photos.map((p) => p.price));

  try {
    const { bundleUnlock, buyerUnlockCount } = await db.$transaction(async (tx) => {
      const debited = await tx.user.updateMany({
        where: { id: buyer.id, pointsBalance: { gte: bundle.price } },
        data: { pointsBalance: { decrement: bundle.price } },
      });
      if (debited.count === 0) throw new Error("INSUFFICIENT_POINTS");

      const bundleUnlock = await tx.bundleUnlock.create({
        data: { buyerId: buyer.id, bundleId: bundle.id, pointsSpent: bundle.price },
      });

      const updatedBuyer = await tx.user.findUniqueOrThrow({ where: { id: buyer.id }, select: { pointsBalance: true } });
      await tx.pointTransaction.create({
        data: {
          userId: buyer.id,
          type: "BUNDLE_SPEND",
          amount: -bundle.price,
          balanceAfter: updatedBuyer.pointsBalance,
          description: `Unlocked bundle "${bundle.title}"`,
        },
      });

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]!;
        const share = shares[i]!;

        // Sellers can each have their own active commission discount
        // (see actions/rewards/redeem.ts), so the effective rate is
        // computed per photo, same as a standalone unlock.
        const seller = await tx.user.findUnique({
          where: { id: photo.sellerId },
          select: { commissionDiscountPercent: true, commissionDiscountUntil: true, pointsBalance: true },
        });
        const hasDiscount = seller?.commissionDiscountUntil && seller.commissionDiscountUntil > new Date();
        const commissionPercent = Math.max(0, platformPercent - (hasDiscount ? seller!.commissionDiscountPercent : 0));
        const platformFee = Math.round((share * commissionPercent) / 100);
        const sellerEarning = share - platformFee;

        const updatedSeller = await tx.user.update({
          where: { id: photo.sellerId },
          data: { pointsBalance: { increment: sellerEarning } },
          select: { pointsBalance: true },
        });

        const unlock = await tx.mysteryUnlock.create({
          data: {
            buyerId: buyer.id,
            photoId: photo.id,
            pointsSpent: share,
            platformFee,
            sellerEarning,
            bundleUnlockId: bundleUnlock.id,
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
            description: `Sale of "${photo.title}" (bundle: ${bundle.title})`,
          },
        });

        await tx.photo.update({ where: { id: photo.id }, data: { unlockCount: { increment: 1 } } });
      }

      const buyerUnlockCount = await tx.mysteryUnlock.count({ where: { buyerId: buyer.id } });
      return { bundleUnlock, buyerUnlockCount };
    });

    try {
      await awardXp(buyer.id, BUNDLE_UNLOCK_XP_REWARD * photos.length);
      await checkAndUnlockAchievements(buyer.id, "unlock_count");
      await recordDailyActivity(buyer.id);
      await recordSeasonActivity(buyer.id, BUNDLE_UNLOCK_XP_REWARD * photos.length);
      await grantReferralBonusIfEligible(buyer.id, buyerUnlockCount);
    } catch (gamificationError) {
      console.error("[marketplace/unlock-bundle] gamification hook failed", gamificationError);
    }

    revalidatePath("/buyer/dashboard");
    revalidatePath("/buyer/dashboard/collection");
    revalidatePath("/marketplace/bundles");

    return { success: true, bundleUnlockId: bundleUnlock.id, photoIds: photos.map((p) => p.id) };
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return { success: false, message: "You don't have enough points to unlock this bundle." };
    }
    console.error("[marketplace/unlock-bundle] failed", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
