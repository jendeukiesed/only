import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    // Credentials provider intentionally lives in lib/auth/auth.ts, not
    // here — it needs Prisma + bcrypt, which are not Edge-runtime safe,
    // and this config is imported by middleware.ts (Edge).
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/buyer/login",
    error: "/buyer/login",
  },
  callbacks: {
    // Edge-safe route protection: runs on every matched request. Full role
    // checks + redirects live in middleware.ts, which composes this.
    authorized({ auth }) {
      return true; // actual gating happens in middleware.ts
    },
  },
} satisfies NextAuthConfig;
