import "server-only";
import OpenAI from "openai";
import { aiScoreResponseSchema } from "@/schemas/ai-scoring.schema";
import { SCORING_SYSTEM_PROMPT } from "./prompt";
import type { AIScoringProvider } from "./provider";

/** Real vision-model scoring via OpenAI's chat completions API (works with
 *  any OpenAI-compatible multimodal model — swap AI_SCORING_MODEL for
 *  another vendor's compatible endpoint without touching this class). */
export class OpenAIScoringProvider implements AIScoringProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.AI_SCORING_API_KEY });
    this.model = process.env.AI_SCORING_MODEL ?? "gpt-4o-mini";
  }

  async analyze(imageUrl: string) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCORING_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Score this dog photo." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from scoring model.");

    const parsed = aiScoreResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error(`Scoring model returned an invalid shape: ${parsed.error.message}`);
    }

    return parsed.data;
  }
}
