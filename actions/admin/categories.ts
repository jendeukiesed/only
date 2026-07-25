"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAdminAction } from "@/services/audit-log/create";
import { createCategorySchema } from "@/schemas/admin.schema";

export async function createCategoryAction(input: { name: string; description?: string; icon?: string }) {
  const admin = await assertRole(Role.ADMIN);
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message };

  const slug = parsed.data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return { success: false, message: "A category with a similar name already exists." };

  await db.category.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description || null, icon: parsed.data.icon || null },
  });

  await logAdminAction({ actorId: admin.id, action: "category.create", targetType: "Category" });
  revalidatePath("/admin/dashboard/categories");
  return { success: true };
}

export async function toggleCategoryActiveAction(categoryId: string) {
  const admin = await assertRole(Role.ADMIN);
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return { success: false, message: "Category not found." };

  await db.category.update({ where: { id: categoryId }, data: { isActive: !category.isActive } });
  await logAdminAction({ actorId: admin.id, action: "category.toggle_active", targetType: "Category", targetId: categoryId });
  revalidatePath("/admin/dashboard/categories");
  return { success: true };
}
