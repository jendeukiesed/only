import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";

/**
 * Integration-style test for the mystery-bundle purchase mutation
 * (actions/marketplace/unlock-bundle.ts) — the multi-photo sibling of
 * actions/marketplace/unlock.ts. Focuses on the guards a single-photo
 * unlock doesn't need (a bundle with an unavailable photo, a bundle that
 * includes the buyer's own upload) and confirms the proportional price
 * split (see tests/unit/split-bundle-price.test.ts for the split math
 * itself) actually reaches the created ledger rows.
 */

const { assertRoleMock } = vi.hoisted(() => ({ assertRoleMock: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({ assertRole: assertRoleMock }));

vi.mock("@/services/gamification/xp", () => ({ awardXp: vi.fn() }));
vi.mock("@/services/gamification/achievements", () => ({ checkAndUnlockAchievements: vi.fn() }));
vi.mock("@/services/gamification/activity", () => ({ recordDailyActivity: vi.fn() }));
vi.mock("@/services/gamification/season", () => ({ recordSeasonActivity: vi.fn() }));
vi.mock("@/services/referrals/grant-bonus", () => ({ grantReferralBonusIfEligible: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const bundleFindUniqueMock = vi.fn();
const platformSettingFindUniqueMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  db: {
    bundle: { findUnique: (...args: unknown[]) => bundleFindUniqueMock(...args) },
    platformSetting: { findUnique: (...args: unknown[]) => platformSettingFindUniqueMock(...args) },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

import { unlockBundleAction } from "@/actions/marketplace/unlock-bundle";

const BUYER = { id: "buyer-1", roles: [Role.BUYER], status: "ACTIVE" };

function makeBundle(overrides: Partial<{ isActive: boolean; price: number; photos: any[] }> = {}) {
  return {
    id: "bundle-1",
    title: "Weekend Pack",
    isActive: overrides.isActive ?? true,
    price: overrides.price ?? 30,
    photos:
      overrides.photos ?? [
        { photo: { id: "photo-1", price: 10, sellerId: "seller-1", title: "A", status: "APPROVED" } },
        { photo: { id: "photo-2", price: 20, sellerId: "seller-2", title: "B", status: "APPROVED" } },
      ],
  };
}

function makeFakeTx(startingBuyerBalance: number) {
  let buyerBalance = startingBuyerBalance;
  const sellerBalances: Record<string, number> = { "seller-1": 100, "seller-2": 100 };

  return {
    user: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        if (buyerBalance >= where.pointsBalance.gte) {
          buyerBalance -= data.pointsBalance.decrement;
          return { count: 1 };
        }
        return { count: 0 };
      }),
      findUniqueOrThrow: vi.fn(async () => ({ pointsBalance: buyerBalance })),
      findUnique: vi.fn(async ({ where }: any) => ({
        commissionDiscountPercent: 0,
        commissionDiscountUntil: null,
        pointsBalance: sellerBalances[where.id] ?? 0,
      })),
      update: vi.fn(async ({ where, data }: any) => {
        sellerBalances[where.id] = (sellerBalances[where.id] ?? 0) + data.pointsBalance.increment;
        return { pointsBalance: sellerBalances[where.id] };
      }),
    },
    bundleUnlock: { create: vi.fn(async () => ({ id: "bundle-unlock-1" })) },
    pointTransaction: { create: vi.fn(async () => ({})) },
    mysteryUnlock: {
      create: vi.fn(async ({ data }: any) => ({ id: `unlock-${data.photoId}` })),
      count: vi.fn(async () => 1),
    },
    photo: { update: vi.fn(async () => ({})) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  assertRoleMock.mockResolvedValue(BUYER);
  platformSettingFindUniqueMock.mockResolvedValue({ value: 20 });
});

describe("unlockBundleAction", () => {
  it("rejects an inactive bundle", async () => {
    bundleFindUniqueMock.mockResolvedValue(makeBundle({ isActive: false }));

    const result = await unlockBundleAction("bundle-1");

    expect(result.success).toBe(false);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects a bundle containing a photo that's no longer approved", async () => {
    bundleFindUniqueMock.mockResolvedValue(
      makeBundle({
        photos: [
          { photo: { id: "photo-1", price: 10, sellerId: "seller-1", title: "A", status: "APPROVED" } },
          { photo: { id: "photo-2", price: 20, sellerId: "seller-2", title: "B", status: "WITHDRAWN" } },
        ],
      }),
    );

    const result = await unlockBundleAction("bundle-1");

    expect(result.success).toBe(false);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects a bundle that includes the buyer's own upload", async () => {
    bundleFindUniqueMock.mockResolvedValue(
      makeBundle({
        photos: [
          { photo: { id: "photo-1", price: 10, sellerId: "buyer-1", title: "Mine", status: "APPROVED" } },
          { photo: { id: "photo-2", price: 20, sellerId: "seller-2", title: "B", status: "APPROVED" } },
        ],
      }),
    );

    const result = await unlockBundleAction("bundle-1");

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/own upload/i);
  });

  it("fails cleanly with insufficient points", async () => {
    bundleFindUniqueMock.mockResolvedValue(makeBundle());
    const fakeTx = makeFakeTx(5);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    const result = await unlockBundleAction("bundle-1");

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/enough points/i);
  });

  it("creates one MysteryUnlock per photo, each carrying the bundleUnlockId", async () => {
    bundleFindUniqueMock.mockResolvedValue(makeBundle());
    const fakeTx = makeFakeTx(100);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    const result = await unlockBundleAction("bundle-1");

    expect(result.success).toBe(true);
    expect(fakeTx.mysteryUnlock.create).toHaveBeenCalledTimes(2);
    for (const call of fakeTx.mysteryUnlock.create.mock.calls) {
      expect(call[0].data.bundleUnlockId).toBe("bundle-unlock-1");
    }
    // Bundle price 30 split proportionally over normal prices 10/20 -> 10/20.
    const spentAmounts = fakeTx.mysteryUnlock.create.mock.calls.map((c: any) => c[0].data.pointsSpent);
    expect(spentAmounts.reduce((a: number, b: number) => a + b, 0)).toBe(30);
  });
});
