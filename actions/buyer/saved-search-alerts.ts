"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { createSavedSearchAlertSchema, type CreateSavedSearchAlertInput } from "@/schemas/buyer.schema";

const MAX_ALERTS_PER_USER = 10;

export async function createSavedSearchAlertAction(input: CreateSavedSearchAlertInput) {
  const user = await assertUser();
  const parsed = createSavedSearchAlertSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid filter." };
  const data = parsed.data;

  if (!data.breed && !data.ageCategory && !data.energyLevel && !data.color && !data.maxPrice) {
    return { success: false, message: "Set at least one filter for the alert." };
  }

  const existingCount = await db.savedSearchAlert.count({ where: { userId: user.id, isActive: true } });
  if (existingCount >= MAX_ALERTS_PER_USER) {
    return { success: false, message: `You can have up to ${MAX_ALERTS_PER_USER} active alerts.` };
  }

  await db.savedSearchAlert.create({
    data: {
      userId: user.id,
      breed: data.breed || null,
      ageCategory: data.ageCategory,
      energyLevel: data.energyLevel,
      color: data.color || null,
      maxPrice: data.maxPrice,
    },
  });

  revalidatePath("/buyer/dashboard/wishlist");
  return { success: true };
}

export async function deleteSavedSearchAlertAction(alertId: string) {
  const user = await assertUser();
  const alert = await db.savedSearchAlert.findUnique({ where: { id: alertId }, select: { userId: true } });
  if (!alert || alert.userId !== user.id) return { success: false, message: "Alert not found." };

  await db.savedSearchAlert.delete({ where: { id: alertId } });
  revalidatePath("/buyer/dashboard/wishlist");
  return { success: true };
}

export async function toggleSavedSearchAlertAction(alertId: string) {
  const user = await assertUser();
  const alert = await db.savedSearchAlert.findUnique({ where: { id: alertId }, select: { userId: true, isActive: true } });
  if (!alert || alert.userId !== user.id) return { success: false, message: "Alert not found." };

  await db.savedSearchAlert.update({ where: { id: alertId }, data: { isActive: !alert.isActive } });
  revalidatePath("/buyer/dashboard/wishlist");
  return { success: true };
}
