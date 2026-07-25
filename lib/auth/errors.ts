import { CredentialsSignin } from "next-auth";

/**
 * Auth.js swallows arbitrary thrown errors from `authorize()` down to a
 * generic "CredentialsSignin" on the client. To surface *why* a login
 * failed (wrong password vs. banned vs. 2FA required) we encode a short
 * machine-readable code in `.code`, which Auth.js *does* preserve on
 * CredentialsSignin subclasses. actions/auth/login.ts maps these codes to
 * user-facing copy — never show `.message` directly to the user.
 */
export class LoginError extends CredentialsSignin {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "invalid_credentials",
  NO_ROLE_ACCOUNT: "no_role_account",
  EMAIL_NOT_VERIFIED: "email_not_verified",
  ACCOUNT_SUSPENDED: "account_suspended",
  ACCOUNT_BANNED: "account_banned",
  TWO_FACTOR_INVALID: "two_factor_invalid",
  TWO_FACTOR_EXPIRED: "two_factor_expired",
  OAUTH_ACCOUNT_CONFLICT: "oauth_account_conflict",
} as const;

/**
 * Signals from `authorize()` that a 2FA challenge is needed. Distinct from
 * LoginError because it must also carry the pending ticket back to the
 * client so step two of the flow can reference it. Encoded as
 * "two_factor_required:<ticket>" and split apart in the login action.
 */
export class TwoFactorRequiredSignal extends CredentialsSignin {
  code: string;
  constructor(ticket: string) {
    super(`two_factor_required:${ticket}`);
    this.code = `two_factor_required:${ticket}`;
  }
}

/**
 * Defensively pulls the `.code` back out of whatever `signIn()` rejects
 * with. Auth.js v5 has, across beta releases, surfaced a thrown
 * CredentialsSignin's custom fields directly on the error and, in other
 * releases, nested under `.cause`. Checking every known shape here means
 * actions/auth/login.ts doesn't have to change if the exact nesting shifts
 * in a future next-auth patch release.
 */
export function extractAuthErrorCode(error: unknown): string {
  const err = error as {
    code?: string;
    type?: string;
    cause?: { code?: string; err?: { code?: string } };
  };
  return (
    err?.code ??
    err?.cause?.err?.code ??
    err?.cause?.code ??
    err?.type ??
    ""
  );
}
