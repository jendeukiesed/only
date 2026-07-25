"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { createAnnouncementSchema } from "@/schemas/admin.schema";

export async function createAnnouncementAction(input: { title: string; body: string; expiresAt?: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = createAnnouncementSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  await db.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: admin.id,
    },
  });

  await logAdminAction({ actorId: admin.id, action: "announcement.create", targetType: "Announcement" });
  revalidatePath("/admin/dashboard/announcements");
  return { success: true };
}

export async function toggleAnnouncementActiveAction(announcementId: string) {
  const admin = await assertRole(Role.ADMIN);
  const announcement = await db.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement) return { success: false, message: "Not found." };

  await db.announcement.update({ where: { id: announcementId }, data: { isActive: !announcement.isActive } });
  await logAdminAction({ actorId: admin.id, action: "announcement.toggle_active", targetType: "Announcement", targetId: announcementId });
  revalidatePath("/admin/dashboard/announcements");
  return { success: true };
}
