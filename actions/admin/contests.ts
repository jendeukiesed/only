"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role, MissionPeriod, ContestStatus } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { createContestSchema, type CreateContestInput } from "@/schemas/admin.schema";

export async function createContestAction(input: CreateContestInput) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = createContestSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid contest." };
  const data = parsed.data;

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  // Zod's `.enum(["WEEKLY", "MONTHLY"])` yields plain string literals, not
  // Prisma's generated (nominal) MissionPeriod/ContestStatus enum types —
  // mapped explicitly here rather than assigned directly, same pattern as
  // actions/auth/register.ts's role conversion.
  const period = data.period === "MONTHLY" ? MissionPeriod.MONTHLY : MissionPeriod.WEEKLY;
  const status = startsAt <= new Date() ? ContestStatus.ACTIVE : ContestStatus.UPCOMING;

  const contest = await db.contest.create({
    data: {
      title: data.title,
      description: data.description,
      period,
      startsAt,
      endsAt,
      firstPrizePoints: data.firstPrizePoints,
      secondPrizePoints: data.secondPrizePoints,
      thirdPrizePoints: data.thirdPrizePoints,
      status,
    },
  });

  await logAdminAction({ actorId: admin.id, action: "contest.create", targetType: "Contest", targetId: contest.id });
  revalidatePath("/admin/dashboard/contests");
  revalidatePath("/contests");
  return { success: true, contestId: contest.id };
}
