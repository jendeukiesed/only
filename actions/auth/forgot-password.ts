"use server";

import { db } from "@/lib/db/prisma";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth.schema";
import { sendEmail } from "@/services/email/send-email";
import PasswordResetEmail from "@/emails/templates/password-reset-email";
import { checkRateLimit, emailRequestRateLimiter } from "@/lib/rate-limit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function requestPasswordResetAction(values: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Enter a valid email address." };
  }
  const { email } = parsed.data;

  const { success: withinLimit } = await checkRateLimit(emailRequestRateLimiter, `forgot-password:${email}`);
  if (!withinLimit) {
    return { success: false, message: "Please wait a few minutes before requesting another reset link." };
  }

  const user = await db.user.findUnique({ where: { email } });

  // Same response whether or not the account exists — prevents account
  // enumeration via the forgot-password form.
  if (user && user.hashedPassword) {
    const token = await createPasswordResetToken(user.id);
    await sendEmail({
      to: email,
      subject: "Reset your PawDrop password",
      react: PasswordResetEmail({
        name: user.name ?? user.username,
        resetUrl: `${APP_URL}/reset-password?token=${token}`,
      }),
    });
  }

  return {
    success: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}
