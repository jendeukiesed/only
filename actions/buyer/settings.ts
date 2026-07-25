"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { updateBuyerProfileSchema, type UpdateBuyerProfileInput } from "@/schemas/buyer.schema";

export async function updateProfileAction(values: UpdateBuyerProfileInput) {
  const user = await assertUser();
  const parsed = updateBuyerProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      image: parsed.data.image || null,
    },
  });

  revalidatePath(`/${user.primaryRole.toLowerCase()}/dashboard/settings`);
  revalidatePath(`/profile/${user.username}`);
  return { success: true };
}
