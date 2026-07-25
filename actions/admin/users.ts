"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { createNotification } from "@/services/notifications/create";
import { suspendUserSchema, banUserSchema, adjustPointsSchema } from "@/schemas/admin.schema";

export async function suspendUserAction(input: { userId: string; reason: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = suspendUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: parsed.data.reason },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "user.suspend",
    targetType: "User",
    targetId: parsed.data.userId,
    metadata: { reason: parsed.data.reason },
  });

  await createNotification({
    userId: parsed.data.userId,
    type: "ACCOUNT_WARNING",
    title: "Account suspended",
    body: `Your account has been suspended: ${parsed.data.reason}`,
  });

  revalidatePath("/admin/dashboard/users");
  return { success: true };
}

export async function banUserAction(input: { userId: string; reason: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = banUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { status: "BANNED", bannedAt: new Date(), bannedReason: parsed.data.reason },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "user.ban",
    targetType: "User",
    targetId: parsed.data.userId,
    metadata: { reason: parsed.data.reason },
  });

  revalidatePath("/admin/dashboard/users");
  return { success: true };
}

export async function reinstateUserAction(userId: string) {
  const admin = await assertRole(Role.ADMIN);

  await db.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      suspendedAt: null,
      suspendedReason: null,
      bannedAt: null,
      bannedReason: null,
    },
  });

  await logAdminAction({ actorId: admin.id, action: "user.reinstate", targetType: "User", targetId: userId });

  await createNotification({
    userId,
    type: "ADMIN_NOTICE",
    title: "Account reinstated",
    body: "Your account is active again. Welcome back!",
  });

  revalidatePath("/admin/dashboard/users");
  return { success: true };
}

export async function adjustPointsAction(input: { userId: string; amount: number; reason: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = adjustPointsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  const updated = await db.user.update({
    where: { id: parsed.data.userId },
    data: { pointsBalance: { increment: parsed.data.amount } },
    select: { pointsBalance: true },
  });

  await db.pointTransaction.create({
    data: {
      userId: parsed.data.userId,
      type: "ADMIN_ADJUSTMENT",
      amount: parsed.data.amount,
      balanceAfter: updated.pointsBalance,
      description: `Admin adjustment: ${parsed.data.reason}`,
    },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "user.adjust_points",
    targetType: "User",
    targetId: parsed.data.userId,
    metadata: { amount: parsed.data.amount, reason: parsed.data.reason },
  });

  await createNotification({
    userId: parsed.data.userId,
    type: "POINTS_RECEIVED",
    title: parsed.data.amount > 0 ? "Points added" : "Points adjusted",
    body: `${parsed.data.amount > 0 ? "+" : ""}${parsed.data.amount} points: ${parsed.data.reason}`,
  });

  revalidatePath("/admin/dashboard/users");
  return { success: true };
}
