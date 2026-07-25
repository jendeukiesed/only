import "server-only";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { ROLE_LOGIN_PATH } from "@/lib/constants/roles";

/**
 * Server-side guards for Server Components, Server Actions, and Route
 * Handlers. These are the *authorization* layer (middleware.ts only does
 * lightweight authentication + route-prefix checks) — call one of these
 * at the top of every server action / page that touches sensitive data,
 * never rely on middleware alone.
 */

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws (via redirect) if there is no signed-in user. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect(ROLE_LOGIN_PATH.BUYER);
  return user;
}

/** Throws (via redirect) if the signed-in user doesn't hold `role`. */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (!user.roles.includes(role)) redirect(ROLE_LOGIN_PATH[role]);
  if (user.status !== "ACTIVE") redirect(`${ROLE_LOGIN_PATH[role]}?error=account_${user.status.toLowerCase()}`);
  return user;
}

export async function requireAdmin() {
  return requireRole(Role.ADMIN);
}

export async function requireSeller() {
  return requireRole(Role.SELLER);
}

export async function requireBuyer() {
  return requireRole(Role.BUYER);
}

/** Non-redirecting variant for Server Actions, where throwing a typed
 *  error and letting the caller render a toast is preferable to a hard
 *  navigation redirect mid-mutation. */
export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function assertRole(role: Role) {
  const user = await assertUser();
  if (!user.roles.includes(role)) throw new ForbiddenError();
  if (user.status !== "ACTIVE") throw new ForbiddenError(`Your account is ${user.status.toLowerCase()}.`);
  return user;
}
