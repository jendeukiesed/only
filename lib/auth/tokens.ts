import { db } from "@/lib/db/prisma";
import { nanoid } from "nanoid";
import { authenticator } from "otplib";
import QRCode from "qrcode";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const TWO_FACTOR_TICKET_TTL_MS = 5 * 60 * 1000; // 5 min

/** Email verification: reuses Auth.js's own VerificationToken table
 *  (identifier = email) rather than inventing a parallel model. */
export async function createEmailVerificationToken(email: string) {
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  const token = nanoid(48);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await db.verificationToken.create({ data: { identifier: email, token, expires } });
  return token;
}

export async function consumeEmailVerificationToken(token: string) {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) return null;
  await db.verificationToken.delete({ where: { token } });
  return record.identifier; // the email
}

export async function createPasswordResetToken(userId: string) {
  await db.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  await db.passwordResetToken.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  await db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}

/**
 * Two-factor login ticket: an opaque, single-use, short-lived handle
 * created the moment a password check succeeds for a 2FA-enabled account.
 * It is NOT the TOTP code — it just lets step two of the Credentials
 * provider ("verify the 6-digit code") happen without re-submitting the
 * password, and without ever putting a real session in the client's hands
 * before the second factor is verified.
 */
export async function createTwoFactorTicket(userId: string) {
  const ticket = nanoid(32);
  const expiresAt = new Date(Date.now() + TWO_FACTOR_TICKET_TTL_MS);
  await db.twoFactorToken.create({ data: { userId, code: ticket, expiresAt } });
  return ticket;
}

export async function consumeTwoFactorTicket(ticket: string) {
  const record = await db.twoFactorToken.findUnique({ where: { code: ticket }, include: { user: true } });
  if (!record || record.consumedAt || record.expiresAt < new Date()) return null;
  await db.twoFactorToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return record.user;
}

/** TOTP secret setup (authenticator-app based 2FA). */
export function generateTotpSecret() {
  return authenticator.generateSecret();
}

export function verifyTotpCode(secret: string, code: string) {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

export async function generateTotpQrCodeDataUrl(email: string, secret: string) {
  const issuer = process.env.TOTP_ISSUER ?? "PawDrop";
  const uri = authenticator.keyuri(email, issuer, secret);
  return QRCode.toDataURL(uri);
}
