"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";

export async function markNotificationReadAction(notificationId: string) {
  const user = await assertUser();
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });
  revalidatePath(`/${user.primaryRole.toLowerCase()}/dashboard/notifications`);
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const user = await assertUser();
  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath(`/${user.primaryRole.toLowerCase()}/dashboard/notifications`);
  return { success: true };
}
