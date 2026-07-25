"use server";

import { db } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createEmailVerificationToken } from "@/lib/auth/tokens";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { sendEmail } from "@/services/email/send-email";
import VerificationEmail from "@/emails/templates/verification-email";
import { checkRateLimit, emailRequestRateLimiter } from "@/lib/rate-limit";
import { createNotification } from "@/services/notifications/create";
import { Role } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const STARTING_BUYER_POINTS = Number(process.env.STARTING_BUYER_POINTS ?? 100);

interface RegisterResult {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof RegisterInput, string>>;
}

export async function registerAction(values: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, message: "Please fix the highlighted fields.", fieldErrors };
  }

  const { name, username, email, password, role, referralCode } = parsed.data;

  const { success: withinLimit } = await checkRateLimit(emailRequestRateLimiter, `register:${email}`);
  if (!withinLimit) {
    return { success: false, message: "Too many attempts. Please try again in a few minutes." };
  }

  const [existingEmail, existingUsername] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (existingEmail) {
    return { success: false, fieldErrors: { email: "An account with this email already exists." } };
  }
  if (existingUsername) {
    return { success: false, fieldErrors: { username: "That username is taken." } };
  }

  const hashedPassword = await hashPassword(password);
  const roleEnum = role === "SELLER" ? Role.SELLER : Role.BUYER;
  const startingPoints = roleEnum === Role.BUYER ? STARTING_BUYER_POINTS : 0;

  // A referral code is opportunistic, not required to succeed — an
  // unrecognized or missing code just means the account isn't attributed
  // to a referrer, it never blocks registration itself. The actual bonus
  // payout happens later, on the referred user's first unlock (see
  // services/referrals/grant-bonus.ts), not here at signup.
  let referredById: string | undefined;
  if (referralCode) {
    const referrer = await db.user.findUnique({ where: { referralCode }, select: { id: true } });
    referredById = referrer?.id;
  }

  const user = await db.user.create({
    data: {
      name,
      username,
      email,
      hashedPassword,
      roles: [roleEnum],
      primaryRole: roleEnum,
      pointsBalance: startingPoints,
      referredById,
    },
  });

  if (referredById) {
    await createNotification({
      userId: referredById,
      type: "REFERRAL_JOINED",
      title: "Someone joined with your link!",
      body: `@${username} signed up using your referral link. You'll both get a bonus once they unlock their first photo.`,
    }).catch((error) => console.error("[auth/register] referral-joined notification failed", error));
  }

  if (startingPoints > 0) {
    await db.pointTransaction.create({
      data: {
        userId: user.id,
        type: "SIGNUP_BONUS",
        amount: startingPoints,
        balanceAfter: startingPoints,
        description: "Welcome bonus",
      },
    });
  }

  const token = await createEmailVerificationToken(email);
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your PawDrop email",
    react: VerificationEmail({ name, verificationUrl }),
  });

  return { success: true };
}
