import { describe, it, expect, vi, beforeEach } from "vitest";

const { userUpdateMock } = vi.hoisted(() => ({ userUpdateMock: vi.fn() }));
const { createNotificationMock } = vi.hoisted(() => ({ createNotificationMock: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  db: { user: { update: userUpdateMock } },
}));
vi.mock("@/services/notifications/create", () => ({
  createNotification: createNotificationMock,
}));

import { levelForXp, xpForNextLevel, awardXp } from "@/services/gamification/xp";

describe("levelForXp", () => {
  it("starts every user at level 1 with 0 xp", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("levels up every 100 xp", () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(250)).toBe(3);
  });
});

describe("xpForNextLevel", () => {
  it("requires level * 100 cumulative xp", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(5)).toBe(500);
  });
});

describe("awardXp", () => {
  beforeEach(() => {
    userUpdateMock.mockReset();
    createNotificationMock.mockReset();
  });

  it("does nothing for a zero or negative amount", async () => {
    await awardXp("user-1", 0);
    await awardXp("user-1", -10);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("increments xp without a level-up notification when the level doesn't change", async () => {
    userUpdateMock.mockResolvedValueOnce({ xp: 50, level: 1 });

    await awardXp("user-1", 10);

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { xp: { increment: 10 } },
      select: { xp: true, level: true },
    });
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("promotes the user's level and notifies them when xp crosses a threshold", async () => {
    // First call returns the post-increment xp/level read; the function's
    // internal `level` field is deliberately stale (still 1) to simulate a
    // user who just crossed from 95 -> 105 xp.
    userUpdateMock.mockResolvedValueOnce({ xp: 105, level: 1 });
    userUpdateMock.mockResolvedValueOnce({ xp: 105, level: 2 });

    await awardXp("user-1", 10);

    expect(userUpdateMock).toHaveBeenCalledTimes(2);
    expect(userUpdateMock).toHaveBeenNthCalledWith(2, {
      where: { id: "user-1" },
      data: { level: 2 },
    });
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", type: "LEVEL_UP" }),
    );
  });
});
