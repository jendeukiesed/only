import { AccountStatus, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * Extends Auth.js's built-in types so `session.user` / the JWT carry the
 * fields PawDrop needs everywhere (role-based redirects, RBAC guards, UI
 * chrome). Deliberately excludes frequently-changing numeric fields
 * (pointsBalance, xp, level) — those are fetched live via TanStack Query
 * instead of trusted from a cached JWT. See lib/auth/auth.ts for why.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      roles: Role[];
      primaryRole: Role;
      status: AccountStatus;
      twoFactorEnabled: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    roles: Role[];
    primaryRole: Role;
    status: AccountStatus;
    twoFactorEnabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    roles: Role[];
    primaryRole: Role;
    status: AccountStatus;
    twoFactorEnabled: boolean;
  }
}
