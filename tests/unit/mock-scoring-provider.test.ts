import { describe, it, expect } from "vitest";
import { MockScoringProvider } from "@/services/ai-scoring/mock-provider";
import { aiScoreResponseSchema } from "@/schemas/ai-scoring.schema";

describe("MockScoringProvider", () => {
  const provider = new MockScoringProvider();

  it("returns a response matching the shared AI score schema", async () => {
    const result = await provider.analyze("https://example.com/dog.jpg");
    expect(() => aiScoreResponseSchema.parse(result)).not.toThrow();
  });

  it("is deterministic for the same image URL", async () => {
    const a = await provider.analyze("https://example.com/dog.jpg");
    const b = await provider.analyze("https://example.com/dog.jpg");
    expect(a).toEqual(b);
  });

  it("produces different scores for different image URLs", async () => {
    const a = await provider.analyze("https://example.com/dog-a.jpg");
    const b = await provider.analyze("https://example.com/dog-b.jpg");
    expect(a.overallScore).not.toBe(b.overallScore);
  });

  it("keeps every sub-score and the overall score within the 0-100 range", async () => {
    const urls = Array.from({ length: 25 }, (_, i) => `https://example.com/dog-${i}.jpg`);
    for (const url of urls) {
      const result = await provider.analyze(url);
      for (const key of [
        "overallScore",
        "cutenessScore",
        "compositionScore",
        "lightingScore",
        "sharpnessScore",
        "emotionScore",
        "colorBalanceScore",
      ] as const) {
        expect(result[key]).toBeGreaterThanOrEqual(0);
        expect(result[key]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("suggests a positive price floor even for a low overall score", async () => {
    const result = await provider.analyze("https://example.com/low-score-seed.jpg");
    expect(result.suggestedPrice).toBeGreaterThanOrEqual(5);
  });
});
