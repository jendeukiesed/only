"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { createBundleSchema, type CreateBundleInput } from "@/schemas/bundles.schema";

export async function createBundleAction(input: CreateBundleInput) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = createBundleSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid bundle." };
  const data = parsed.data;

  const photos = await db.photo.findMany({
    where: { id: { in: data.photoIds }, status: "APPROVED" },
    select: { id: true },
  });
  if (photos.length !== data.photoIds.length) {
    return { success: false, message: "One or more photos aren't approved listings." };
  }

  const bundle = await db.bundle.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      createdById: admin.id,
      photos: { create: data.photoIds.map((photoId) => ({ photoId })) },
    },
  });

  await logAdminAction({ actorId: admin.id, action: "bundle.create", targetType: "Bundle", targetId: bundle.id });
  revalidatePath("/admin/dashboard/bundles");
  revalidatePath("/marketplace/bundles");
  return { success: true, bundleId: bundle.id };
}

export async function deactivateBundleAction(bundleId: string) {
  const admin = await assertRole(Role.ADMIN);
  await db.bundle.update({ where: { id: bundleId }, data: { isActive: false } });
  await logAdminAction({ actorId: admin.id, action: "bundle.deactivate", targetType: "Bundle", targetId: bundleId });
  revalidatePath("/admin/dashboard/bundles");
  revalidatePath("/marketplace/bundles");
  return { success: true };
}
