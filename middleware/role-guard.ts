import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { ROLE_ROUTE_PREFIX, ROLE_LOGIN_PATH, ROLE_DASHBOARD_PATH } from "@/lib/constants/roles";

export interface AuthedRequestUser {
  id: string;
  roles: Role[];
  primaryRole: Role;
  status: string;
}

const PROTECTED_PREFIXES: { prefix: string; role: Role }[] = [
  { prefix: ROLE_ROUTE_PREFIX.BUYER + "/dashboard", role: Role.BUYER },
  { prefix: ROLE_ROUTE_PREFIX.SELLER + "/dashboard", role: Role.SELLER },
  { prefix: ROLE_ROUTE_PREFIX.ADMIN + "/dashboard", role: Role.ADMIN },
];

/**
 * Route-level gate, run on every request by middleware.ts (Edge runtime).
 * This is a coarse, fast check based on the JWT alone — it decides
 * "can this request even reach the page", not fine-grained data access
 * (that's lib/auth/rbac.ts, run again inside the Server Component/Action
 * with a fresh DB read, since the JWT can be up to 30 days stale on
 * status changes like a mid-session ban).
 */
export function guardRoleRoutes(req: NextRequest, user: AuthedRequestUser | undefined) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return null;

  if (!user) {
    const loginUrl = new URL(ROLE_LOGIN_PATH[match.role], req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user.roles.includes(match.role)) {
    // Signed in, but with the wrong account type for this area — bounce to
    // their own dashboard rather than a login page they'd bounce off too.
    return NextResponse.redirect(new URL(ROLE_DASHBOARD_PATH[user.primaryRole], req.url));
  }

  if (user.status !== "ACTIVE") {
    const loginUrl = new URL(ROLE_LOGIN_PATH[match.role], req.url);
    loginUrl.searchParams.set("error", `account_${user.status.toLowerCase()}`);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}

/** Signed-in users hitting a login/register page get bounced to their
 *  dashboard instead of seeing the form again. */
const AUTH_PAGE_PREFIXES = ["/buyer/login", "/buyer/register", "/seller/login", "/seller/register", "/admin/login"];

export function guardAuthPages(req: NextRequest, user: AuthedRequestUser | undefined) {
  const { pathname } = req.nextUrl;
  if (!user) return null;
  if (AUTH_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL(ROLE_DASHBOARD_PATH[user.primaryRole], req.url));
  }
  return null;
}
