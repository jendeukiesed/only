"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { createNotification } from "@/services/notifications/create";
import { checkAndUnlockAchievements } from "@/services/gamification/achievements";
import { awardXp } from "@/services/gamification/xp";
import { notifyMatchingSavedSearches } from "@/services/search-alerts/notify-matches";
import { moderationActionSchema, rejectPhotoSchema } from "@/schemas/admin.schema";

export async function approvePhotoAction(photoId: string) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = moderationActionSchema.safeParse({ photoId });
  if (!parsed.success) return { success: false, message: "Invalid photo." };

  const photo = await db.photo.update({
    where: { id: photoId },
    data: { status: "APPROVED", approvedById: admin.id, approvedAt: new Date() },
    select: {
      id: true,
      sellerId: true,
      title: true,
      breed: true,
      ageCategory: true,
      energyLevel: true,
      color: true,
      price: true,
    },
  });

  await logAdminAction({ actorId: admin.id, action: "photo.approve", targetType: "Photo", targetId: photoId });

  await createNotification({
    userId: photo.sellerId,
    type: "UPLOAD_APPROVED",
    title: "Photo approved",
    body: `"${photo.title}" is now live in the marketplace.`,
    link: "/seller/dashboard/uploads",
  });

  try {
    await awardXp(photo.sellerId, 20);
    await checkAndUnlockAchievements(photo.sellerId, "approved_count");
  } catch (error) {
    console.error("[admin/moderation] gamification hook failed", error);
  }

  try {
    await notifyMatchingSavedSearches(photo);
  } catch (error) {
    console.error("[admin/moderation] saved-search alert matching failed", error);
  }

  revalidatePath("/admin/dashboard/moderation");
  revalidatePath("/seller/dashboard/uploads");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function rejectPhotoAction(input: { photoId: string; reason: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = rejectPhotoSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  const photo = await db.photo.update({
    where: { id: parsed.data.photoId },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.reason,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
    select: { sellerId: true, title: true },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "photo.reject",
    targetType: "Photo",
    targetId: parsed.data.photoId,
    metadata: { reason: parsed.data.reason },
  });

  await createNotification({
    userId: photo.sellerId,
    type: "UPLOAD_REJECTED",
    title: "Photo rejected",
    body: `"${photo.title}" was rejected: ${parsed.data.reason}`,
    link: "/seller/dashboard/uploads",
  });

  revalidatePath("/admin/dashboard/moderation");
  revalidatePath("/seller/dashboard/uploads");
  return { success: true };
}
