import type { AIScoreResponse } from "@/schemas/ai-scoring.schema";

/** Every scoring backend (OpenAI vision today, swap in another vendor or
 *  a self-hosted model later) implements this one method. */
export interface AIScoringProvider {
  readonly name: string;
  analyze(imageUrl: string): Promise<AIScoreResponse>;
}
