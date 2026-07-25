import { describe, it, expect, vi, beforeEach } from "vitest";

const { createNotificationMock } = vi.hoisted(() => ({ createNotificationMock: vi.fn() }));
vi.mock("@/services/notifications/create", () => ({ createNotification: createNotificationMock }));

const userFindUniqueMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: { findUnique: (...args: unknown[]) => userFindUniqueMock(...args) },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

import { grantReferralBonusIfEligible } from "@/services/referrals/grant-bonus";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeFakeTx(overrides: { alreadyRewarded?: boolean } = {}) {
  return {
    user: {
      findUnique: vi.fn(async () => ({ referralRewardedAt: overrides.alreadyRewarded ? new Date() : null })),
      update: vi.fn(async () => ({ pointsBalance: 125 })),
    },
    pointTransaction: { create: vi.fn(async () => ({})) },
  };
}

describe("grantReferralBonusIfEligible", () => {
  it("does nothing when this isn't the buyer's first unlock", async () => {
    await grantReferralBonusIfEligible("buyer-1", 2);
    expect(userFindUniqueMock).not.toHaveBeenCalled();
  });

  it("does nothing when the buyer wasn't referred by anyone", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "buyer-1", username: "jane", referredById: null, referralRewardedAt: null });

    await grantReferralBonusIfEligible("buyer-1", 1);

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("does nothing when the referral bonus was already paid out", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "buyer-1",
      username: "jane",
      referredById: "referrer-1",
      referralRewardedAt: new Date(),
    });

    await grantReferralBonusIfEligible("buyer-1", 1);

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("pays out both referrer and referee on a first eligible unlock", async () => {
    userFindUniqueMock
      .mockResolvedValueOnce({ id: "buyer-1", username: "jane", referredById: "referrer-1", referralRewardedAt: null })
      .mockResolvedValueOnce({ id: "referrer-1", pointsBalance: 100 });
    const fakeTx = makeFakeTx();
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    await grantReferralBonusIfEligible("buyer-1", 1);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(fakeTx.user.update).toHaveBeenCalledTimes(2); // buyer + referrer
    expect(fakeTx.pointTransaction.create).toHaveBeenCalledTimes(2);
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "referrer-1", type: "REFERRAL_REWARDED" }),
    );
  });

  it("skips paying out again if a concurrent call already set referralRewardedAt", async () => {
    userFindUniqueMock
      .mockResolvedValueOnce({ id: "buyer-1", username: "jane", referredById: "referrer-1", referralRewardedAt: null })
      .mockResolvedValueOnce({ id: "referrer-1", pointsBalance: 100 });
    const fakeTx = makeFakeTx({ alreadyRewarded: true });
    transactionMock.mockImplementation(async (callback: any) => callback(fakeTx));

    await grantReferralBonusIfEligible("buyer-1", 1);

    expect(fakeTx.user.update).not.toHaveBeenCalled();
    expect(fakeTx.pointTransaction.create).not.toHaveBeenCalled();
  });
});
