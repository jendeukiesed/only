import { test as base, expect, type Page } from "@playwright/test";

/**
 * Credentials for the seeded accounts created by `npm run db:seed` (see
 * db/prisma/seed/seed.ts and the README "Getting started" section). These
 * tests assume that seed has been run against whatever database the app
 * under test is pointed at — they don't create their own fixtures via the
 * UI, since registration itself is covered separately in auth.spec.ts.
 */
export const SEEDED_BUYER = { email: "dogloverjane@pawdrop.app", password: "Password123!" };
export const SEEDED_SELLER = { email: "goldenpaws@pawdrop.app", password: "Password123!" };
export const SEEDED_ADMIN = {
  email: "admin@pawdrop.app",
  password: process.env.ADMIN_SEED_PASSWORD ?? "Password123!",
};

export async function loginAs(
  page: Page,
  role: "buyer" | "seller" | "admin",
  creds: { email: string; password: string },
) {
  await page.goto(`/${role}/login`);
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: /sign in as/i }).click();
}

export const test = base;
export { expect };
