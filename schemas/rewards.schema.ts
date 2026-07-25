import { z } from "zod";

export const redeemRewardSchema = z.object({
  rewardItemId: z.string().min(1),
});
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;

/** Shapes of RewardItem.metadata per category — validated at redemption
 *  time rather than trusted blindly, since it's a Json column an admin
 *  edits directly (see db/prisma/seed/seed.ts for the catalog). */
export const profileBadgeMetadataSchema = z.object({ badgeKey: z.string().min(1) });
export const featureBoostMetadataSchema = z.object({ boostDays: z.number().int().min(1).max(30) });
export const commissionDiscountMetadataSchema = z.object({
  discountPercent: z.number().int().min(1).max(20),
  days: z.number().int().min(1).max(90),
});
