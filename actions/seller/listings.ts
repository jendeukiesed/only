"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole, ForbiddenError } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { editPhotoSchema, type EditPhotoInput } from "@/schemas/seller.schema";

async function assertOwnsPhoto(sellerId: string, photoId: string) {
  const photo = await db.photo.findUnique({ where: { id: photoId }, select: { sellerId: true } });
  if (!photo || photo.sellerId !== sellerId) throw new ForbiddenError("You don't own this listing.");
  return photo;
}

export async function editPhotoAction(input: EditPhotoInput) {
  const user = await assertRole(Role.SELLER);
  const parsed = editPhotoSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  await assertOwnsPhoto(user.id, parsed.data.photoId);

  await db.photo.update({
    where: { id: parsed.data.photoId },
    data: { title: parsed.data.title, description: parsed.data.description || null, price: parsed.data.price },
  });

  revalidatePath("/seller/dashboard/uploads");
  return { success: true };
}

/** "Delete" here means withdraw from the marketplace, not hard-delete —
 *  preserves referential integrity for any existing unlocks/likes/comments
 *  tied to the photo, and matches the spec's "Withdraw Photos" seller
 *  capability rather than a destructive delete. */
export async function withdrawPhotoAction(photoId: string) {
  const user = await assertRole(Role.SELLER);
  await assertOwnsPhoto(user.id, photoId);

  await db.photo.update({
    where: { id: photoId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  revalidatePath("/seller/dashboard/uploads");
  return { success: true };
}
