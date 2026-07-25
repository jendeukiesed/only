import { ScoreTier } from "@prisma/client";

/** Maps a raw 0-100 AI overall score to its marketplace tier. The single
 *  source of truth for this mapping — services/ai-scoring (persists
 *  Photo.scoreTier at upload time), db/prisma/seed/seed.ts, and
 *  components/shared/score-tier-badge.tsx all import from here instead of
 *  each having their own copy that could drift out of sync. */
export function scoreTierFromScore(score: number): ScoreTier {
  if (score >= 95) return ScoreTier.LEGENDARY;
  if (score >= 85) return ScoreTier.PLATINUM;
  if (score >= 70) return ScoreTier.GOLD;
  if (score >= 50) return ScoreTier.SILVER;
  return ScoreTier.BRONZE;
}
