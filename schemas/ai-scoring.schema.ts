import { z } from "zod";

/** The shape we ask the vision model to return, and validate its response
 *  against — an LLM returning malformed JSON or an out-of-range score
 *  should never crash the upload flow or corrupt a PhotoScore row. */
export const aiScoreResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  cutenessScore: z.number().min(0).max(100),
  compositionScore: z.number().min(0).max(100),
  lightingScore: z.number().min(0).max(100),
  sharpnessScore: z.number().min(0).max(100),
  emotionScore: z.number().min(0).max(100),
  colorBalanceScore: z.number().min(0).max(100),
  suggestedPrice: z.number().min(1).max(500),
  confidenceScore: z.number().min(0).max(1),
  explanation: z.string().min(1).max(600),

  // Content moderation opinion from the same vision-model call — a hint
  // for the moderation queue (see Photo.moderationFlag), never an
  // auto-reject on its own, since a vision model's "is this a dog" call
  // can be wrong on an unusual angle, a costume, or a low-quality photo.
  isDogPhoto: z.boolean().default(true),
  moderationNote: z.string().max(300).nullable().default(null),
});
export type AIScoreResponse = z.infer<typeof aiScoreResponseSchema>;
