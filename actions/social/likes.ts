"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { createNotification } from "@/services/notifications/create";

export async function toggleLikeAction(photoId: string) {
  const user = await assertUser();

  const existing = await db.like.findUnique({ where: { userId_photoId: { userId: user.id, photoId } } });

  if (existing) {
    await db.$transaction([
      db.like.delete({ where: { id: existing.id } }),
      db.photo.update({ where: { id: photoId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return { success: true, liked: false };
  }

  const photo = await db.photo.findUnique({ where: { id: photoId }, select: { sellerId: true, title: true } });
  if (!photo) return { success: false, message: "Photo not found." };

  await db.$transaction([
    db.like.create({ data: { userId: user.id, photoId } }),
    db.photo.update({ where: { id: photoId }, data: { likeCount: { increment: 1 } } }),
  ]);

  if (photo.sellerId !== user.id) {
    await createNotification({
      userId: photo.sellerId,
      type: "NEW_LIKE",
      title: "New like",
      body: `@${user.username} liked "${photo.title}"`,
      link: `/seller/dashboard/uploads`,
    });
  }

  revalidatePath("/marketplace");
  return { success: true, liked: true };
}
