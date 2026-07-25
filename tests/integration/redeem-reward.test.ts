import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";

/**
 * Integration-style test for the rewards catalog's spend-points mutation
 * (actions/rewards/redeem.ts) — mirrors the mocking approach used for the
 * marketplace unlock action: `db` is mocked at the module boundary and the
 * `$transaction` callback runs against a hand-built fake `tx`, so the real
 * business logic (role gating per category, duplicate-badge guard,
 * insufficient-points handling, effect application) is actually exercised.
 */

const { assertUserMock } = vi.hoisted(() => ({ assertUserMock: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({ assertUser: assertUserMock }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { createNotificationMock } = vi.hoisted(() => ({ createNotificationMock: vi.fn() }));
vi.mock("@/services/notifications/create", () => ({ createNotification: createNotificationMock }));

const rewardItemFindUniqueMock = vi.fn();
const userBadgeFindFirstMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  db: {
    rewardItem: { findUnique: (...args: unknown[]) => rewardItemFindUniqueMock(...args) },
    userBadge: { findFirst: (...args: unknown[]) => userBadgeFindFirstMock(...args) },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

import { redeemRewardAction } from "@/actions/rewards/redeem";

const BUYER = { id: "buyer-1", roles: [Role.BUYER], status: "ACTIVE" };
const SELLER = { id: "seller-1", roles: [Role.SELLER], status: "ACTIVE" };

function makeFakeTx(startingBalance: number) {
  let balance = startingBalance;
  return {
    user: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        if (balance >= where.pointsBalance.gte) {
          balance -= data.pointsBalance.decrement;
          return { count: 1 };
        }
        return { count: 0 };
      }),
      findUniqueOrThrow: vi.fn(async () => ({ pointsBalance: balance })),
      update: vi.fn(async () => ({ pointsBalance: balance })),
    },
    pointTransaction: { create: vi.fn(async () => ({})) },
    userBadge: { create: vi.fn(async () => ({})) },
    badge: { findUnique: vi.fn(async () => ({ id: "badge-1", key: "founding_member" })) },
    featuredCreator: { create: vi.fn(async () => ({})) },
    rewardRedemption: { create: vi.fn(async () => ({})) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  userBadgeFindFirstMock.mockResolvedValue(null);
});

describe("redeemRewardAction", () => {
  it("rejects redeeming a reward that no longer exists or is inactive", async () => {
    assertUserMock.mockResolvedValue(BUYER);
    rewardItemFindUniqueMock.mockResolvedValue(null);

    const result = await redeemRewardAction({ rewardItemId: "missing" });

    expect(result.success).toBe(false);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("blocks a buyer from redeeming a seller-only reward category", async () => {
    assertUserMock.mockResolvedValue(BUYER);
    rewardItemFindUniqueMock.mockResolvedValue({
      id: "r1", isActive: true, category: "FEATURE_BOOST", pointsCost: 150, metadata: { boostDays: 3 }, name: "Boost",
    });

    const result = await redeemRewardAction({ rewardItemId: "r1" });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/only available to sellers/i);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("blocks redeeming a badge the user already owns", async () => {
    assertUserMock.mockResolvedValue(BUYER);
    rewardItemFindUniqueMock.mockResolvedValue({
      id: "r2", isActive: true, category: "PROFILE_BADGE", pointsCost: 50, metadata: { badgeKey: "founding_member" }, name: "Badge",
    });
    userBadgeFindFirstMock.mockResolvedValue({ id: "existing" });

    const result = await redeemRewardAction({ rewardItemId: "r2" });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/already own/i);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("fails cleanly when the buyer can't afford the reward", async () => {
    assertUserMock.mockResolvedValue(BUYER);
    rewardItemFindUniqueMock.mockResolvedValue({
      id: "r2", isActive: true, category: "PROFILE_BADGE", pointsCost: 50, metadata: { badgeKey: "founding_member" }, name: "Badge",
    });
    const fakeTx = makeFakeTx(10);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    const result = await redeemRewardAction({ rewardItemId: "r2" });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/enough points/i);
  });

  it("grants a commission discount to an eligible seller", async () => {
    assertUserMock.mockResolvedValue(SELLER);
    rewardItemFindUniqueMock.mockResolvedValue({
      id: "r3",
      isActive: true,
      category: "COMMISSION_DISCOUNT",
      pointsCost: 300,
      metadata: { discountPercent: 10, days: 30 },
      name: "10% off",
    });
    const fakeTx = makeFakeTx(500);
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    const result = await redeemRewardAction({ rewardItemId: "r3" });

    expect(result.success).toBe(true);
    expect(fakeTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ commissionDiscountPercent: 10 }) }),
    );
    expect(fakeTx.rewardRedemption.create).toHaveBeenCalled();
  });
});
