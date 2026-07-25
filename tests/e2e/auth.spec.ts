import { test, expect } from "./fixtures";
import { SEEDED_BUYER, SEEDED_SELLER, SEEDED_ADMIN, loginAs } from "./fixtures";

/**
 * Auth is the highest-value thing to cover end-to-end: it's the one flow
 * where a Vitest unit test mocking `auth()`/Prisma would give false
 * confidence (the real risk is in the Auth.js Credentials `authorize()`
 * wiring, cookies, and redirects, not the pure logic around them).
 */

test.describe("buyer login", () => {
  test("signs a seeded buyer in and lands on the buyer dashboard", async ({ page }) => {
    await loginAs(page, "buyer", SEEDED_BUYER);
    await expect(page).toHaveURL(/\/buyer\/dashboard/);
  });

  test("shows an inline error for a wrong password instead of navigating away", async ({ page }) => {
    await loginAs(page, "buyer", { email: SEEDED_BUYER.email, password: "WrongPassword1" });
    await expect(page).toHaveURL(/\/buyer\/login/);
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
  });

  test("a seller account can't sign in through the buyer login form", async ({ page }) => {
    await loginAs(page, "buyer", SEEDED_SELLER);
    await expect(page).toHaveURL(/\/buyer\/login/);
  });
});

test.describe("seller login", () => {
  test("signs a seeded seller in and lands on the seller dashboard", async ({ page }) => {
    await loginAs(page, "seller", SEEDED_SELLER);
    await expect(page).toHaveURL(/\/seller\/dashboard/);
  });
});

test.describe("admin login", () => {
  test("signs the seeded admin in and lands on the admin dashboard", async ({ page }) => {
    await loginAs(page, "admin", SEEDED_ADMIN);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("has no Google sign-in option (credentials-only surface)", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("button", { name: /google/i })).toHaveCount(0);
  });
});

test.describe("registration", () => {
  test("a new buyer can register and is shown the verify-email confirmation", async ({ page }) => {
    const unique = Date.now();
    await page.goto("/buyer/register");

    await page.locator('label:has-text("Full name") + input').fill("E2E Test User");
    await page.locator('label:has-text("Username") + input').fill(`e2euser${unique}`);
    await page.locator('label:has-text("Email") + input').fill(`e2euser${unique}@example.com`);
    await page.locator('label:has-text("Confirm password") + input').fill("Password1");
    await page.locator('label:has-text("Password") + input').first().fill("Password1");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /create buyer account/i }).click();

    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  test("rejects mismatched passwords before hitting the server", async ({ page }) => {
    const unique = Date.now();
    await page.goto("/buyer/register");

    await page.locator('label:has-text("Full name") + input').fill("E2E Mismatch User");
    await page.locator('label:has-text("Username") + input').fill(`e2emismatch${unique}`);
    await page.locator('label:has-text("Email") + input').fill(`e2emismatch${unique}@example.com`);
    await page.locator('label:has-text("Password") + input').first().fill("Password1");
    await page.locator('label:has-text("Confirm password") + input').fill("Password2");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /create buyer account/i }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
});

test.describe("route protection", () => {
  test("an unauthenticated visitor is redirected away from a buyer dashboard route", async ({ page }) => {
    await page.goto("/buyer/dashboard");
    await expect(page).toHaveURL(/\/buyer\/login/);
  });

  test("a signed-in buyer can't reach the admin dashboard", async ({ page }) => {
    await loginAs(page, "buyer", SEEDED_BUYER);
    await page.goto("/admin/dashboard");
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });
});
