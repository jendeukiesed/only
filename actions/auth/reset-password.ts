"use server";

import { db } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { consumePasswordResetToken } from "@/lib/auth/tokens";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth.schema";

export async function resetPasswordAction(values: ResetPasswordInput) {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const { token, password } = parsed.data;

  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    return { success: false, message: "This reset link is invalid or has expired. Request a new one." };
  }

  const hashedPassword = await hashPassword(password);
  await db.user.update({ where: { id: userId }, data: { hashedPassword } });

  return { success: true };
}
