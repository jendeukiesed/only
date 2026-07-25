import { describe, it, expect } from "vitest";
import { splitBundlePrice } from "@/services/marketplace/split-bundle-price";

describe("splitBundlePrice", () => {
  it("splits proportionally to each photo's normal price", () => {
    // Normal prices 10/20/30 (total 60), bundle sold for 30 (half price):
    // each share should be exactly half its normal price.
    expect(splitBundlePrice(30, [10, 20, 30])).toEqual([5, 10, 15]);
  });

  it("always sums to exactly the bundle price despite integer rounding", () => {
    const shares = splitBundlePrice(37, [7, 11, 13]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(37);
  });

  it("falls back to an even split when every normal price is zero", () => {
    const shares = splitBundlePrice(30, [0, 0, 0]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(30);
    expect(shares.slice(0, 2)).toEqual([10, 10]);
  });

  it("handles a single-photo bundle (still sums exactly)", () => {
    expect(splitBundlePrice(15, [15])).toEqual([15]);
  });

  it("folds the rounding remainder into the last share, not the first", () => {
    const shares = splitBundlePrice(10, [1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10);
    expect(shares[shares.length - 1]).toBeGreaterThanOrEqual(shares[0]!);
  });
});
