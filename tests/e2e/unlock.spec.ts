import { test, expect } from "./fixtures";
import { SEEDED_BUYER, loginAs } from "./fixtures";

/**
 * The mystery-unlock purchase flow is the core transaction of the whole
 * product, so it gets a dedicated end-to-end spec on top of the mocked
 * Vitest coverage in tests/integration/unlock.test.ts. This exercises the
 * real Server Action, real Prisma transaction, and real point balance
 * against the seeded database.
 */
test.describe("mystery unlock flow", () => {
  test("a buyer can browse the marketplace, unlock a photo, and see it in their collection", async ({ page }) => {
    await loginAs(page, "buyer", SEEDED_BUYER);

    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();

    const firstUnlockButton = page.getByRole("button", { name: /unlock for/i }).first();
    await expect(firstUnlockButton).toBeVisible();
    await firstUnlockButton.click();

    await expect(page).toHaveURL(/\/mystery\//);

    await page.getByRole("button", { name: /unlock for/i }).click();

    await expect(page.getByText(/unlocked/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /view in collection/i })).toBeVisible();

    await page.getByRole("button", { name: /view in collection/i }).click();
    await expect(page).toHaveURL(/\/buyer\/dashboard\/collection/);
  });

  test("a buyer can't unlock the same mystery page twice into an inconsistent state", async ({ page }) => {
    await loginAs(page, "buyer", SEEDED_BUYER);
    await page.goto("/marketplace");

    const firstUnlockButton = page.getByRole("button", { name: /unlock for/i }).first();
    await firstUnlockButton.click();
    await expect(page).toHaveURL(/\/mystery\//);

    const unlockButton = page.getByRole("button", { name: /unlock for/i });
    await unlockButton.click();
    await expect(page.getByText(/unlocked/i)).toBeVisible({ timeout: 10_000 });

    // After a successful reveal the page no longer offers an "Unlock for"
    // button at all (it shows "View in collection" / "Keep browsing"
    // instead), so a double-click or back-button replay can't double-charge.
    await expect(page.getByRole("button", { name: /unlock for/i })).toHaveCount(0);
  });

  test("the buyer's points balance decreases by the unlocked photo's price", async ({ page }) => {
    await loginAs(page, "buyer", SEEDED_BUYER);

    await page.goto("/buyer/dashboard");
    const balanceBefore = await readPointsBalance(page);

    await page.goto("/marketplace");
    const unlockButton = page.getByRole("button", { name: /unlock for/i }).first();
    const priceMatch = (await unlockButton.textContent())?.match(/(\d+)/);
    const price = priceMatch ? Number(priceMatch[1]) : 0;
    await unlockButton.click();
    await page.getByRole("button", { name: /unlock for/i }).click();
    await expect(page.getByText(/unlocked/i)).toBeVisible({ timeout: 10_000 });

    await page.goto("/buyer/dashboard");
    const balanceAfter = await readPointsBalance(page);

    expect(balanceAfter).toBe(balanceBefore - price);
  });
});

async function readPointsBalance(page: import("@playwright/test").Page): Promise<number> {
  const text = await page.getByTestId("points-balance").textContent();
  return Number((text ?? "0").replace(/[^\d-]/g, ""));
}
