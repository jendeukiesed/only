"use server";

import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";

export async function toggleBookmarkAction(photoId: string) {
  const user = await assertUser();

  const existing = await db.bookmark.findUnique({ where: { userId_photoId: { userId: user.id, photoId } } });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return { success: true, bookmarked: false };
  }

  await db.bookmark.create({ data: { userId: user.id, photoId } });
  return { success: true, bookmarked: true };
}
