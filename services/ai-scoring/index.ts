import "server-only";
import { OpenAIScoringProvider } from "./openai-provider";
import { MockScoringProvider } from "./mock-provider";
import type { AIScoringProvider } from "./provider";
import type { AIScoreResponse } from "@/schemas/ai-scoring.schema";

const mockProvider = new MockScoringProvider();

function getConfiguredProvider(): AIScoringProvider {
  if (process.env.AI_SCORING_PROVIDER === "openai" && process.env.AI_SCORING_API_KEY) {
    return new OpenAIScoringProvider();
  }
  return mockProvider;
}

/**
 * Public entry point for the whole scoring service. Used by
 * actions/seller/upload.ts right after a Cloudinary upload succeeds.
 * Always resolves — a misconfigured/unreachable real provider falls back
 * to the deterministic mock rather than blocking the seller's upload, and
 * the fallback is flagged in the result so calling code (or an admin view,
 * later) can tell a real score from a placeholder one.
 */
export async function analyzePhoto(imageUrl: string): Promise<AIScoreResponse & { usedFallback: boolean; modelUsed: string }> {
  const provider = getConfiguredProvider();

  try {
    const result = await provider.analyze(imageUrl);
    return { ...result, usedFallback: provider.name !== "openai", modelUsed: provider.name };
  } catch (error) {
    console.error("[ai-scoring] provider failed, falling back to mock", { provider: provider.name, error });
    if (provider.name === "mock") throw error; // mock itself should never throw
    const fallback = await mockProvider.analyze(imageUrl);
    return { ...fallback, usedFallback: true, modelUsed: "mock (fallback)" };
  }
}
