"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { createNotification } from "@/services/notifications/create";
import { checkAndUnlockAchievements } from "@/services/gamification/achievements";

export async function toggleFollowAction(sellerId: string) {
  const user = await assertUser();
  if (user.id === sellerId) return { success: false, message: "You can't follow yourself." };

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: sellerId } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    revalidatePath(`/profile`);
    return { success: true, following: false };
  }

  const seller = await db.user.findUnique({ where: { id: sellerId }, select: { username: true } });
  if (!seller) return { success: false, message: "Creator not found." };

  await db.follow.create({ data: { followerId: user.id, followingId: sellerId } });

  await createNotification({
    userId: sellerId,
    type: "NEW_FOLLOWER",
    title: "New follower",
    body: `@${user.username} started following you`,
    link: "/seller/dashboard/followers",
  });

  try {
    await checkAndUnlockAchievements(user.id, "following_count");
  } catch (error) {
    console.error("[social/follow] gamification hook failed", error);
  }

  revalidatePath(`/profile/${seller.username}`);
  return { success: true, following: true };
}
