import { describe, it, expect } from "vitest";
import { ScoreTier } from "@prisma/client";
import { scoreTierFromScore } from "@/utils/score-tier";

describe("scoreTierFromScore", () => {
  it("maps the boundary values to the correct tier (inclusive lower bound)", () => {
    expect(scoreTierFromScore(95)).toBe(ScoreTier.LEGENDARY);
    expect(scoreTierFromScore(85)).toBe(ScoreTier.PLATINUM);
    expect(scoreTierFromScore(70)).toBe(ScoreTier.GOLD);
    expect(scoreTierFromScore(50)).toBe(ScoreTier.SILVER);
    expect(scoreTierFromScore(0)).toBe(ScoreTier.BRONZE);
  });

  it("falls back to the next tier down just below each boundary", () => {
    expect(scoreTierFromScore(94)).toBe(ScoreTier.PLATINUM);
    expect(scoreTierFromScore(84)).toBe(ScoreTier.GOLD);
    expect(scoreTierFromScore(69)).toBe(ScoreTier.SILVER);
    expect(scoreTierFromScore(49)).toBe(ScoreTier.BRONZE);
  });

  it("handles the extremes of the 0-100 scale", () => {
    expect(scoreTierFromScore(100)).toBe(ScoreTier.LEGENDARY);
    expect(scoreTierFromScore(1)).toBe(ScoreTier.BRONZE);
  });
});
