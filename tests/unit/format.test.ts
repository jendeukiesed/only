import { describe, it, expect } from "vitest";
import {
  formatPoints,
  formatCompactNumber,
  formatPercent,
  titleCaseEnum,
  pluralize,
} from "@/utils/format";

describe("formatPoints", () => {
  it("adds thousands separators", () => {
    expect(formatPoints(1000)).toBe("1,000");
    expect(formatPoints(1234567)).toBe("1,234,567");
  });

  it("rounds fractional point values", () => {
    expect(formatPoints(99.6)).toBe("100");
  });

  it("formats zero and negative values", () => {
    expect(formatPoints(0)).toBe("0");
    expect(formatPoints(-50)).toBe("-50");
  });
});

describe("formatCompactNumber", () => {
  it("compacts large numbers", () => {
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(2000000)).toBe("2M");
  });

  it("leaves small numbers as-is", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });
});

describe("formatPercent", () => {
  it("appends a percent sign with the default 0 fraction digits", () => {
    expect(formatPercent(42.7)).toBe("43%");
  });

  it("respects a custom fraction digit count", () => {
    expect(formatPercent(42.75, 1)).toBe("42.8%");
  });
});

describe("titleCaseEnum", () => {
  it("converts SCREAMING_SNAKE_CASE to Title Case", () => {
    expect(titleCaseEnum("FRENCH_BULLDOG")).toBe("French Bulldog");
    expect(titleCaseEnum("GOLDEN_RETRIEVER")).toBe("Golden Retriever");
  });

  it("handles single-word input", () => {
    expect(titleCaseEnum("PUPPY")).toBe("Puppy");
  });
});

describe("pluralize", () => {
  it("returns the singular form for a count of exactly 1", () => {
    expect(pluralize(1, "photo")).toBe("photo");
  });

  it("returns the default plural (singular + s) for any other count", () => {
    expect(pluralize(0, "photo")).toBe("photos");
    expect(pluralize(5, "photo")).toBe("photos");
  });

  it("uses an explicit irregular plural when provided", () => {
    expect(pluralize(2, "story", "stories")).toBe("stories");
  });
});
