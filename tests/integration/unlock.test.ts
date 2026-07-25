import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";

/**
 * Integration-style test for the single riskiest mutation in the app: the
 * mystery-unlock transaction that moves points between a buyer and seller.
 * Prisma itself isn't available in this sandboxed environment (no working
 * Postgres/network for `prisma generate`), so `db` and the auth/gamification
 * dependencies are mocked at the module boundary and the transaction
 * callback is executed against an in-memory fake `tx` — this still
 * exercises the exact business logic in actions/marketplace/unlock.ts
 * (commission math, race-safe balance check, ledger rows, best-effort
 * gamification) without needing a real database.
 */

const { assertRoleMock } = vi.hoisted(() => ({ assertRoleMock: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({ assertRole: assertRoleMock }));

const { awardXpMock } = vi.hoisted(() => ({ awardXpMock: vi.fn() }));
vi.mock("@/services/gamification/xp", () => ({ awardXp: awardXpMock }));

const { checkAndUnlockAchievementsMock } = vi.hoisted(() => ({
  checkAndUnlockAchievementsMock: vi.fn(),
}));
vi.mock("@/services/gamification/achievements", () => ({
  checkAndUnlockAchievements: checkAndUnlockAchievementsMock,
}));

const { recordDailyActivityMock } = vi.hoisted(() => ({ recordDailyActivityMock: vi.fn() }));
vi.mock("@/services/gamification/activity", () => ({ recordDailyActivity: recordDailyActivityMock }));

const { recordSeasonActivityMock } = vi.hoisted(() => ({ recordSeasonActivityMock: vi.fn() }));
vi.mock("@/services/gamification/season", () => ({ recordSeasonActivity: recordSeasonActivityMock }));

const { grantReferralBonusIfEligibleMock } = vi.hoisted(() => ({ grantReferralBonusIfEligibleMock: vi.fn() }));
vi.mock("@/services/referrals/grant-bonus", () => ({
  grantReferralBonusIfEligible: grantReferralBonusIfEligibleMock,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const photoFindUniqueMock = vi.fn();
const photoFindUniqueOrThrowMock = vi.fn();
const platformSettingFindUniqueMock = vi.fn();
const userFindUniqueMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  db: {
    photo: {
      findUnique: (...args: unknown[]) => photoFindUniqueMock(...args),
      findUniqueOrThrow: (...args: unknown[]) => photoFindUniqueOrThrowMock(...args),
    },
    platformSetting: {
      findUnique: (...args: unknown[]) => platformSettingFindUniqueMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => userFindUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

import { unlockPhotoAction } from "@/actions/marketplace/unlock";

const BUYER = { id: "buyer-1", roles: [Role.BUYER], status: "ACTIVE" };
const APPROVED_PHOTO = {
  id: "photo-1",
  price: 100,
  sellerId: "seller-1",
  title: "Good Boy",
  status: "APPROVED",
};

/** Builds a fake `tx` whose `user.updateMany` respects a starting balance,
 *  mirroring the real conditional-decrement guard closely enough to test
 *  both the success and insufficient-funds branches. */
function makeFakeTx(startingBuyerBalance: number) {
  let buyerBalance = startingBuyerBalance;
  let sellerBalance = 500;

  return {
    user: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        if (buyerBalance >= where.pointsBalance.gte) {
          buyerBalance -= data.pointsBalance.decrement;
          return { count: 1 };
        }
        return { count: 0 };
      }),
      findUniqueOrThrow: vi.fn(async ({ where }: any) => {
        if (where.id === "buyer-1") return { pointsBalance: buyerBalance };
        return { pointsBalance: sellerBalance };
      }),
      update: vi.fn(async ({ data }: any) => {
        sellerBalance += data.pointsBalance.increment;
        return { pointsBalance: sellerBalance };
      }),
    },
    mysteryUnlock: {
      create: vi.fn(async () => ({ id: "unlock-1" })),
      count: vi.fn(async () => 1),
    },
    pointTransaction: {
      create: vi.fn(async () => ({})),
    },
    photo: {
      update: vi.fn(async () => ({})),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  assertRoleMock.mockResolvedValue(BUYER);
  platformSettingFindUniqueMock.mockResolvedValue({ value: 20 }); // 20% commission
  photoFindUniqueOrThrowMock.mockResolvedValue({ url: "https://example.com/dog.jpg", title: "Good Boy" });
  // No active seller commission discount by default.
  userFindUniqueMock.mockResolvedValue({ commissionDiscountPercent: 0, commissionDiscountUntil: null });
});

describe("unlockPhotoAction", () => {
  it("rejects unlocking a photo that isn't APPROVED", async () => {
    photoFindUniqueMock.mockResolvedValue({ ...APPROVED_PHOTO, status: "PENDING" });

    const result = await unlockPhotoAction("photo-1");

    expect(result.success).toBe(false);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects unlocking your own upload", async () => {
    photoFindUniqueMock.mockResolvedValue({ ...APPROVED_PHOTO, sellerId: "buyer-1" });

    const result = await unlockPhotoAction("photo-1");

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/own upload/i);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("fails cleanly with insufficient points instead of a generic error", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    const fakeTx = makeFakeTx(50); // less than the 100-point price
    transactionMock.mockImplementation(async (callback: any) => {
      try {
        return await callback(fakeTx);
      } catch (err) {
        if (err instanceof Error && err.message === "INSUFFICIENT_POINTS") throw err;
        throw err;
      }
    });

    const result = await unlockPhotoAction("photo-1");

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/enough points/i);
  });

  it("splits payment between platform commission and seller earning correctly", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    const fakeTx = makeFakeTx(200);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    const result = await unlockPhotoAction("photo-1");

    expect(result.success).toBe(true);
    // 20% of 100 = 20 platform fee, 80 seller earning.
    expect(fakeTx.mysteryUnlock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        buyerId: "buyer-1",
        photoId: "photo-1",
        pointsSpent: 100,
        platformFee: 20,
        sellerEarning: 80,
      }),
    });
    expect(fakeTx.pointTransaction.create).toHaveBeenCalledTimes(2);
  });

  it("still returns success if the best-effort gamification hooks throw", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    const fakeTx = makeFakeTx(200);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));
    awardXpMock.mockRejectedValueOnce(new Error("gamification down"));

    const result = await unlockPhotoAction("photo-1");

    expect(result.success).toBe(true);
  });

  it("falls back to the env-var commission default when no PlatformSetting row exists", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    platformSettingFindUniqueMock.mockResolvedValue(null);
    const fakeTx = makeFakeTx(200);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    const result = await unlockPhotoAction("photo-1");

    expect(result.success).toBe(true);
    expect(fakeTx.mysteryUnlock.create).toHaveBeenCalled();
  });

  it("reduces the platform's cut when the seller has an active commission-discount reward", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    userFindUniqueMock.mockResolvedValue({
      commissionDiscountPercent: 10,
      commissionDiscountUntil: new Date(Date.now() + 1000 * 60 * 60 * 24), // still active
    });
    const fakeTx = makeFakeTx(200);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    await unlockPhotoAction("photo-1");

    // 20% platform default - 10% seller discount = 10% -> fee 10, earning 90.
    expect(fakeTx.mysteryUnlock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ platformFee: 10, sellerEarning: 90 }),
    });
  });

  it("ignores an expired commission-discount reward", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    userFindUniqueMock.mockResolvedValue({
      commissionDiscountPercent: 10,
      commissionDiscountUntil: new Date(Date.now() - 1000), // expired
    });
    const fakeTx = makeFakeTx(200);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    await unlockPhotoAction("photo-1");

    expect(fakeTx.mysteryUnlock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ platformFee: 20, sellerEarning: 80 }),
    });
  });

  it("calls the referral bonus check with the buyer's post-unlock total", async () => {
    photoFindUniqueMock.mockResolvedValue(APPROVED_PHOTO);
    const fakeTx = makeFakeTx(200);
    fakeTx.mysteryUnlock.count = vi.fn(async () => 3);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    await unlockPhotoAction("photo-1");

    expect(grantReferralBonusIfEligibleMock).toHaveBeenCalledWith("buyer-1", 3);
    expect(recordDailyActivityMock).toHaveBeenCalledWith("buyer-1");
    expect(recordSeasonActivityMock).toHaveBeenCalledWith("buyer-1", 10);
  });
});
