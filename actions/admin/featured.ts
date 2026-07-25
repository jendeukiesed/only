"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";

export async function createFeaturedCreatorAction(input: { sellerId: string; days: number }) {
  const admin = await assertRole(Role.ADMIN);

  const startAt = new Date();
  const endAt = new Date();
  endAt.setDate(endAt.getDate() + input.days);

  const existingCount = await db.featuredCreator.count();

  await db.featuredCreator.create({
    data: {
      sellerId: input.sellerId,
      position: existingCount,
      startAt,
      endAt,
      createdById: admin.id,
    },
  });

  await createNotificationForFeature(input.sellerId);
  await logAdminAction({ actorId: admin.id, action: "featured.create", targetType: "FeaturedCreator", targetId: input.sellerId });
  revalidatePath("/admin/dashboard/featured");
  return { success: true };
}

async function createNotificationForFeature(sellerId: string) {
  const { createNotification } = await import("@/services/notifications/create");
  await createNotification({
    userId: sellerId,
    type: "FEATURED",
    title: "You're featured!",
    body: "Your profile is now featured on the PawDrop homepage.",
  });
}
