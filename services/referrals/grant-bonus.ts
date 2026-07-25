import "server-only";
import { db } from "@/lib/db/prisma";
import { TransactionType } from "@prisma/client";
import { createNotification } from "@/services/notifications/create";

const REFEREE_BONUS = Number(process.env.REFERRAL_REFEREE_BONUS ?? 25);
const REFERRER_BONUS = Number(process.env.REFERRAL_REFERRER_BONUS ?? 25);

/**
 * Pays out the one-time referral bonus the moment a referred buyer
 * completes their *first* mystery unlock — not at registration — so the
 * reward tracks "this referral actually became an active user," not just
 * "someone clicked a link and made an account." Called from
 * actions/marketplace/unlock.ts's best-effort post-purchase side effects,
 * same as XP/achievements, so a failure here never blocks the purchase
 * itself.
 *
 * `referralRewardedAt` is the idempotency guard: it's checked and set
 * inside the same transaction as both point grants, so a buyer whose
 * first two unlocks race each other can't trigger the bonus twice.
 */
export async function grantReferralBonusIfEligible(buyerId: string, unlockCountForBuyer: number) {
  if (unlockCountForBuyer !== 1) return; // only the buyer's first-ever unlock qualifies

  const buyer = await db.user.findUnique({
    where: { id: buyerId },
    select: { id: true, username: true, referredById: true, referralRewardedAt: true },
  });
  if (!buyer?.referredById || buyer.referralRewardedAt) return;

  const referrer = await db.user.findUnique({ where: { id: buyer.referredById }, select: { id: true, pointsBalance: true } });
  if (!referrer) return;

  await db.$transaction(async (tx) => {
    const stillEligible = await tx.user.findUnique({
      where: { id: buyerId },
      select: { referralRewardedAt: true },
    });
    if (stillEligible?.referralRewardedAt) return; // lost the race to a concurrent call

    const updatedBuyer = await tx.user.update({
      where: { id: buyerId },
      data: { pointsBalance: { increment: REFEREE_BONUS }, referralRewardedAt: new Date() },
      select: { pointsBalance: true },
    });
    await tx.pointTransaction.create({
      data: {
        userId: buyerId,
        type: TransactionType.REFERRAL_BONUS,
        amount: REFEREE_BONUS,
        balanceAfter: updatedBuyer.pointsBalance,
        description: "Referral welcome bonus",
      },
    });

    const updatedReferrer = await tx.user.update({
      where: { id: referrer.id },
      data: { pointsBalance: { increment: REFERRER_BONUS } },
      select: { pointsBalance: true },
    });
    await tx.pointTransaction.create({
      data: {
        userId: referrer.id,
        type: TransactionType.REFERRAL_BONUS,
        amount: REFERRER_BONUS,
        balanceAfter: updatedReferrer.pointsBalance,
        description: `Referral bonus — @${buyer.username} made their first unlock`,
      },
    });
  });

  await createNotification({
    userId: referrer.id,
    type: "REFERRAL_REWARDED",
    title: "Referral bonus earned!",
    body: `@${buyer.username} made their first unlock — you both earned ${REFERRER_BONUS} points.`,
  });
}
