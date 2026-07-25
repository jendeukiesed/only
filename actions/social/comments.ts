"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { createNotification } from "@/services/notifications/create";
import { createCommentSchema, type CreateCommentInput } from "@/schemas/social.schema";

export async function createCommentAction(input: CreateCommentInput) {
  const user = await assertUser();
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  const photo = await db.photo.findUnique({
    where: { id: parsed.data.photoId },
    select: { sellerId: true, title: true },
  });
  if (!photo) return { success: false, message: "Photo not found." };

  const parent = parsed.data.parentId
    ? await db.comment.findUnique({ where: { id: parsed.data.parentId }, select: { userId: true } })
    : null;

  const comment = await db.comment.create({
    data: {
      photoId: parsed.data.photoId,
      userId: user.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    },
  });

  await db.photo.update({ where: { id: parsed.data.photoId }, data: { commentCount: { increment: 1 } } });

  if (parent && parent.userId !== user.id) {
    await createNotification({
      userId: parent.userId,
      type: "COMMENT_REPLY",
      title: "New reply",
      body: `@${user.username} replied to your comment`,
    });
  } else if (!parent && photo.sellerId !== user.id) {
    await createNotification({
      userId: photo.sellerId,
      type: "NEW_COMMENT",
      title: "New comment",
      body: `@${user.username} commented on "${photo.title}"`,
      link: "/seller/dashboard/uploads",
    });
  }

  revalidatePath(`/buyer/dashboard/collection/${parsed.data.photoId}`);
  return { success: true, commentId: comment.id };
}

/** Sellers pin comments on their own photos; admins can pin anywhere
 *  (moderation). */
export async function togglePinCommentAction(commentId: string) {
  const user = await assertUser();

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { isPinned: true, photoId: true, photo: { select: { sellerId: true } } },
  });
  if (!comment) return { success: false, message: "Comment not found." };

  const isOwner = comment.photo.sellerId === user.id;
  const isAdmin = user.roles.includes(Role.ADMIN);
  if (!isOwner && !isAdmin) return { success: false, message: "Not allowed." };

  await db.comment.update({ where: { id: commentId }, data: { isPinned: !comment.isPinned } });
  revalidatePath(`/buyer/dashboard/collection/${comment.photoId}`);
  return { success: true };
}

export async function deleteCommentAction(commentId: string) {
  const user = await assertUser();
  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { userId: true, photoId: true } });
  if (!comment) return { success: false, message: "Comment not found." };
  if (comment.userId !== user.id && !user.roles.includes(Role.ADMIN)) {
    return { success: false, message: "Not allowed." };
  }

  await db.comment.update({ where: { id: commentId }, data: { deletedAt: new Date(), body: "[deleted]" } });
  revalidatePath(`/buyer/dashboard/collection/${comment.photoId}`);
  return { success: true };
}
