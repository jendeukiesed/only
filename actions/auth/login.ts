"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth/auth";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { checkRateLimit, loginRateLimiter } from "@/lib/rate-limit";
import { AUTH_ERROR_CODES, extractAuthErrorCode } from "@/lib/auth/errors";
import { ROLE_DASHBOARD_PATH } from "@/lib/constants/roles";

type LoginResult =
  | { status: "success"; redirectTo: string }
  | { status: "two_factor_required"; ticket: string }
  | { status: "error"; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: "Incorrect email or password.",
  [AUTH_ERROR_CODES.NO_ROLE_ACCOUNT]: "No account of this type was found for that email. Wrong login page?",
  [AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED]: "Please verify your email before signing in — check your inbox.",
  [AUTH_ERROR_CODES.ACCOUNT_SUSPENDED]: "This account is currently suspended. Contact support for details.",
  [AUTH_ERROR_CODES.ACCOUNT_BANNED]: "This account has been banned.",
  [AUTH_ERROR_CODES.TWO_FACTOR_INVALID]: "That code didn't match. Please try again.",
  [AUTH_ERROR_CODES.TWO_FACTOR_EXPIRED]: "That login attempt expired. Please sign in again.",
};

export async function authenticateAction(values: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email and password." };
  }
  const { email, password, role } = parsed.data;

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";
  const { success: withinLimit } = await checkRateLimit(loginRateLimiter, `login:${ip}:${email}`);
  if (!withinLimit) {
    return { status: "error", message: "Too many login attempts. Please wait a few minutes and try again." };
  }

  try {
    await signIn("credentials", { email, password, role, redirect: false });
    return { status: "success", redirectTo: ROLE_DASHBOARD_PATH[role] };
  } catch (error) {
    if (error instanceof AuthError) {
      const code = extractAuthErrorCode(error);

      if (code.startsWith("two_factor_required:")) {
        const ticket = code.split(":")[1] ?? "";
        return { status: "two_factor_required", ticket };
      }

      return { status: "error", message: ERROR_MESSAGES[code] ?? "Something went wrong. Please try again." };
    }
    throw error;
  }
}

/** Step two of the 2FA login flow: called from the /two-factor page once
 *  the user submits their authenticator code. */
export async function completeTwoFactorLoginAction(
  ticket: string,
  code: string,
  role: LoginInput["role"],
): Promise<LoginResult> {
  try {
    await signIn("credentials", { twoFactorTicket: ticket, twoFactorCode: code, redirect: false });
    return { status: "success", redirectTo: ROLE_DASHBOARD_PATH[role] };
  } catch (error) {
    if (error instanceof AuthError) {
      const authCode = extractAuthErrorCode(error);
      return { status: "error", message: ERROR_MESSAGES[authCode] ?? "Invalid or expired code." };
    }
    throw error;
  }
}
