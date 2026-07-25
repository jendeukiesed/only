"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { updatePlatformSettingSchema } from "@/schemas/admin.schema";

export async function updatePlatformSettingAction(input: { key: string; value: number | string | boolean }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = updatePlatformSettingSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  await db.platformSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value, updatedById: admin.id },
    create: { key: parsed.data.key, value: parsed.data.value, updatedById: admin.id },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "settings.update",
    targetType: "PlatformSetting",
    targetId: parsed.data.key,
    metadata: { value: parsed.data.value },
  });

  revalidatePath("/admin/dashboard/economy");
  return { success: true };
}
