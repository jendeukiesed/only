/**
 * Splits a bundle's discounted total price across its N photos
 * proportionally to each photo's normal marketplace price, so a
 * higher-value photo in the bundle earns its seller proportionally more
 * of the bundle revenue rather than an even N-way split. Remainders from
 * integer rounding are folded into the last item so the shares always sum
 * to exactly `bundlePrice`.
 *
 * Pulled out of actions/marketplace/unlock-bundle.ts into its own module
 * (rather than a local helper) for two reasons: a `"use server"` file may
 * only export async functions, and this pure function is independently
 * unit-testable without needing to mock Prisma/auth at all.
 */
export function splitBundlePrice(bundlePrice: number, normalPrices: number[]): number[] {
  const totalNormalValue = normalPrices.reduce((sum, p) => sum + p, 0);
  if (totalNormalValue === 0) {
    const even = Math.floor(bundlePrice / normalPrices.length);
    const shares = normalPrices.map(() => even);
    shares[shares.length - 1]! += bundlePrice - even * normalPrices.length;
    return shares;
  }

  const shares = normalPrices.map((price) => Math.floor((price / totalNormalValue) * bundlePrice));
  const remainder = bundlePrice - shares.reduce((sum, s) => sum + s, 0);
  shares[shares.length - 1]! += remainder;
  return shares;
}
