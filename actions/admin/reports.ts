"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { resolveReportSchema } from "@/schemas/admin.schema";

export async function resolveReportAction(input: { reportId: string; status: "ACTION_TAKEN" | "DISMISSED"; resolutionNote?: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = resolveReportSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  await db.report.update({
    where: { id: parsed.data.reportId },
    data: {
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await logAdminAction({
    actorId: admin.id,
    action: `report.${parsed.data.status.toLowerCase()}`,
    targetType: "Report",
    targetId: parsed.data.reportId,
  });

  revalidatePath("/admin/dashboard/reports");
  return { success: true };
}
