import type { AIScoreResponse } from "@/schemas/ai-scoring.schema";
import type { AIScoringProvider } from "./provider";

/** Deterministic, zero-cost fallback — used automatically when
 *  AI_SCORING_API_KEY isn't set (local dev, CI) and as a resilience
 *  fallback if the real provider errors or times out, so an upload never
 *  gets stuck because a third-party API had a bad moment. Same image URL
 *  always yields the same scores (simple string hash seeds a small PRNG),
 *  so re-running the seed script or retrying an upload doesn't produce
 *  wildly different results for the same input. */
export class MockScoringProvider implements AIScoringProvider {
  readonly name = "mock";

  async analyze(imageUrl: string): Promise<AIScoreResponse> {
    const seed = hashString(imageUrl);
    const rand = mulberry32(seed);

    const cuteness = scaleToRange(rand(), 40, 99);
    const composition = scaleToRange(rand(), 35, 95);
    const lighting = scaleToRange(rand(), 40, 95);
    const sharpness = scaleToRange(rand(), 45, 98);
    const emotion = scaleToRange(rand(), 40, 97);
    const colorBalance = scaleToRange(rand(), 40, 95);

    const overall = Math.round(
      cuteness * 0.3 + composition * 0.15 + lighting * 0.15 + sharpness * 0.15 + emotion * 0.15 + colorBalance * 0.1,
    );

    return {
      overallScore: overall,
      cutenessScore: cuteness,
      compositionScore: composition,
      lightingScore: lighting,
      sharpnessScore: sharpness,
      emotionScore: emotion,
      colorBalanceScore: colorBalance,
      suggestedPrice: Math.max(5, Math.round(overall / 3)),
      confidenceScore: 0.6,
      explanation:
        "Mock score (no AI_SCORING_API_KEY configured): estimated from a deterministic placeholder model, not a real vision analysis.",
      // The mock never actually looks at the image, so it can't meaningfully
      // moderate content — always reports "safe" rather than guessing, and
      // real moderation only ever runs when a real vision provider is
      // configured.
      isDogPhoto: true,
      moderationNote: null,
    };
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scaleToRange(value01: number, min: number, max: number): number {
  return Math.round(min + value01 * (max - min));
}
