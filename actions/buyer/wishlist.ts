"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { toggleWishlistSchema } from "@/schemas/buyer.schema";

export async function toggleWishlistAction(photoId: string) {
  const user = await assertUser();
  const parsed = toggleWishlistSchema.safeParse({ photoId });
  if (!parsed.success) return { success: false, message: "Invalid photo." };

  const existing = await db.wishlist.findUnique({
    where: { userId_photoId: { userId: user.id, photoId } },
  });

  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    revalidatePath("/buyer/dashboard/wishlist");
    return { success: true, wishlisted: false };
  }

  await db.wishlist.create({ data: { userId: user.id, photoId } });
  revalidatePath("/buyer/dashboard/wishlist");
  return { success: true, wishlisted: true };
}
