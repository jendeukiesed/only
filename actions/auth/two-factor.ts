"use server";

import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { verifyPassword } from "@/lib/auth/password";
import { generateTotpSecret, generateTotpQrCodeDataUrl, verifyTotpCode } from "@/lib/auth/tokens";
import { twoFactorSetupConfirmSchema, twoFactorDisableSchema } from "@/schemas/auth.schema";

/**
 * Step 1 of enabling 2FA: generate a fresh TOTP secret and QR code, but do
 * NOT persist it yet — persisting happens only after the user proves they
 * scanned it correctly in confirmTwoFactorSetupAction. This avoids locking
 * an account into a secret the user never actually saved to their
 * authenticator app.
 */
export async function beginTwoFactorSetupAction() {
  const user = await assertUser();
  const secret = generateTotpSecret();
  const qrCodeDataUrl = await generateTotpQrCodeDataUrl(user.email!, secret);
  return { secret, qrCodeDataUrl };
}

export async function confirmTwoFactorSetupAction(secret: string, values: { code: string }) {
  const user = await assertUser();
  const parsed = twoFactorSetupConfirmSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Enter the 6-digit code." };

  const valid = verifyTotpCode(secret, parsed.data.code);
  if (!valid) return { success: false, message: "That code didn't match. Check your app and try again." };

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorSecret: secret },
  });

  return { success: true };
}

export async function disableTwoFactorAction(values: { password: string }) {
  const user = await assertUser();
  const parsed = twoFactorDisableSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Enter your password to confirm." };

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.hashedPassword) {
    return { success: false, message: "This account has no password set (Google sign-in only)." };
  }

  const passwordsMatch = await verifyPassword(parsed.data.password, dbUser.hashedPassword);
  if (!passwordsMatch) return { success: false, message: "Incorrect password." };

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { success: true };
}
