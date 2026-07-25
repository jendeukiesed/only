"use server";

import { db } from "@/lib/db/prisma";
import { consumeEmailVerificationToken, createEmailVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/services/email/send-email";
import WelcomeEmail from "@/emails/templates/welcome-email";
import VerificationEmail from "@/emails/templates/verification-email";
import { ROLE_DASHBOARD_PATH } from "@/lib/constants/roles";
import { checkRateLimit, emailRequestRateLimiter } from "@/lib/rate-limit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function verifyEmailAction(token: string) {
  if (!token) return { success: false, message: "Missing verification token." };

  const email = await consumeEmailVerificationToken(token);
  if (!email) {
    return { success: false, message: "This verification link is invalid or has expired." };
  }

  const user = await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to PawDrop 🐾",
    react: WelcomeEmail({
      name: user.name ?? user.username,
      role: user.primaryRole === "SELLER" ? "SELLER" : "BUYER",
      dashboardUrl: `${APP_URL}${ROLE_DASHBOARD_PATH[user.primaryRole]}`,
    }),
  });

  return { success: true, redirectTo: ROLE_DASHBOARD_PATH[user.primaryRole] };
}

export async function resendVerificationEmailAction(email: string) {
  const { success: withinLimit } = await checkRateLimit(emailRequestRateLimiter, `resend-verify:${email}`);
  if (!withinLimit) {
    return { success: false, message: "Please wait a few minutes before requesting another email." };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Always return a generic success message — don't leak whether an email
  // is registered.
  if (!user || user.emailVerified) {
    return { success: true };
  }

  const token = await createEmailVerificationToken(email);
  await sendEmail({
    to: email,
    subject: "Verify your PawDrop email",
    react: VerificationEmail({
      name: user.name ?? user.username,
      verificationUrl: `${APP_URL}/verify-email?token=${token}`,
    }),
  });

  return { success: true };
}
