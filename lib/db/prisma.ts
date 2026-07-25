import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Next.js dev mode hot-reloads modules, which would otherwise instantiate a
 * new PrismaClient (and a new connection pool) on every file change. We
 * stash the instance on `globalThis` in non-production environments to
 * avoid exhausting the Postgres connection limit.
 *
 * Every other layer in the app (services/, actions/) must import `db` from
 * here — never instantiate `new PrismaClient()` anywhere else.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export type { Prisma } from "@prisma/client";
export * from "@prisma/client";
