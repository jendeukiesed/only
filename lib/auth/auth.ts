import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";

import authConfig from "@/lib/auth/auth.config";
import { db } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createTwoFactorTicket, consumeTwoFactorTicket, verifyTotpCode } from "@/lib/auth/tokens";
import { LoginError, TwoFactorRequiredSignal, AUTH_ERROR_CODES } from "@/lib/auth/errors";
import { credentialsAuthorizeSchema } from "@/schemas/auth.schema";
import { recordDailyActivity } from "@/services/gamification/activity";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      // credentials shape documented in schemas/auth.schema.ts; Auth.js
      // only uses this object for the generated (unused) default sign-in
      // form, our own forms post real values.
      credentials: {
        email: {},
        password: {},
        role: {},
        twoFactorTicket: {},
        twoFactorCode: {},
      },
      async authorize(raw) {
        const parsed = credentialsAuthorizeSchema.safeParse(raw);
        if (!parsed.success) throw new LoginError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        const { email, password, role, twoFactorTicket, twoFactorCode } = parsed.data;

        // ── Step two: completing a pending 2FA challenge ──────────────
        if (twoFactorTicket && twoFactorCode) {
          const user = await consumeTwoFactorTicket(twoFactorTicket);
          if (!user) throw new LoginError(AUTH_ERROR_CODES.TWO_FACTOR_EXPIRED);
          const valid = user.twoFactorSecret && verifyTotpCode(user.twoFactorSecret, twoFactorCode);
          if (!valid) throw new LoginError(AUTH_ERROR_CODES.TWO_FACTOR_INVALID);
          await db.user.update({ where: { id: user.id }, data: { lastActiveDate: new Date() } });
          await recordDailyActivity(user.id);
          return toSessionUser(user);
        }

        // ── Step one: normal email + password check ───────────────────
        // The refine() on credentialsAuthorizeSchema guarantees email and
        // password are both present whenever we get this far without
        // having taken the 2FA branch above.
        if (!email || !password) throw new LoginError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.hashedPassword) throw new LoginError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);

        const passwordsMatch = await verifyPassword(password, user.hashedPassword);
        if (!passwordsMatch) throw new LoginError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);

        if (user.status === "BANNED") throw new LoginError(AUTH_ERROR_CODES.ACCOUNT_BANNED);
        if (user.status === "SUSPENDED") throw new LoginError(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED);

        // Each login surface (buyer/seller/admin) only accepts accounts that
        // actually hold that role — logging in on /seller/login with a
        // buyer-only account fails here rather than silently succeeding.
        if (role && !user.roles.includes(role as Role)) {
          throw new LoginError(AUTH_ERROR_CODES.NO_ROLE_ACCOUNT);
        }

        if (!user.emailVerified) throw new LoginError(AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED);

        if (user.twoFactorEnabled) {
          const ticket = await createTwoFactorTicket(user.id);
          throw new TwoFactorRequiredSignal(ticket);
        }

        await db.user.update({ where: { id: user.id }, data: { lastActiveDate: new Date() } });
        await recordDailyActivity(user.id);

        return toSessionUser(user);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // OAuth (Google): block banned/suspended accounts at the door.
      if (account?.provider === "google") {
        const existing = await db.user.findUnique({ where: { email: user.email! } });
        if (existing?.status === "BANNED" || existing?.status === "SUSPENDED") return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.roles = user.roles;
        token.primaryRole = user.primaryRole;
        token.status = user.status;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }
      // Allows client to call `update()` from useSession() after e.g.
      // changing username/avatar without forcing a full re-login.
      if (trigger === "update") {
        const fresh = await db.user.findUnique({ where: { id: token.id as string } });
        if (fresh) {
          token.username = fresh.username;
          token.roles = fresh.roles;
          token.primaryRole = fresh.primaryRole;
          token.status = fresh.status;
          token.twoFactorEnabled = fresh.twoFactorEnabled;
          token.name = fresh.name;
          token.picture = fresh.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.roles = token.roles as Role[];
      session.user.primaryRole = token.primaryRole as Role;
      session.user.status = token.status as any;
      session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // New Google sign-ups: Google verifies email ownership already, and
      // default them to the buyer role (sellers opt in later from their
      // dashboard — see actions/seller/apply.ts in Stage 7).
      if (user.id) {
        await db.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
            roles: [Role.BUYER],
            primaryRole: Role.BUYER,
            username: (user.email ?? `user_${user.id}`).split("@")[0] + "_" + user.id.slice(-5),
          },
        });
      }
    },
  },
});

function toSessionUser(user: {
  id: string;
  email: string;
  name: string | null;
  username: string;
  image: string | null;
  roles: Role[];
  primaryRole: Role;
  status: string;
  twoFactorEnabled: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    image: user.image,
    roles: user.roles,
    primaryRole: user.primaryRole,
    status: user.status as any,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}
