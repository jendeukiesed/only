import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth/auth.config";
import { guardRoleRoutes, guardAuthPages } from "@/middleware/role-guard";

// Edge-safe: this instance is built from auth.config.ts only (no Prisma,
// no bcrypt, no Credentials provider) so it can run in the Edge runtime
// that Next.js middleware uses by default. It only ever *reads* the JWT.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const user = req.auth?.user as
    | { id: string; roles: any; primaryRole: any; status: string }
    | undefined;

  const authPageRedirect = guardAuthPages(req, user);
  if (authPageRedirect) return authPageRedirect;

  const roleRedirect = guardRoleRoutes(req, user);
  if (roleRedirect) return roleRedirect;

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets, images, and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
