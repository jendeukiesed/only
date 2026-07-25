"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreTierBadge } from "@/components/shared/score-tier-badge";
import { scoreTierFromScore } from "@/utils/score-tier";
import { staggerContainer, fadeInUp } from "@/lib/constants/motion";
import type { AIScoreResponse } from "@/schemas/ai-scoring.schema";

const DIMENSIONS: { key: keyof AIScoreResponse; label: string }[] = [
  { key: "cutenessScore", label: "Cuteness" },
  { key: "compositionScore", label: "Composition" },
  { key: "lightingScore", label: "Lighting" },
  { key: "sharpnessScore", label: "Sharpness" },
  { key: "emotionScore", label: "Emotion" },
  { key: "colorBalanceScore", label: "Color balance" },
];

/** Shown right after a seller uploads a photo (features/seller/components/
 *  upload-form.tsx) and on the photo detail/edit view — the spec calls for
 *  every uploaded image to return an overall score, six sub-scores, a
 *  suggested price, a confidence score, and a brief explanation. */
export function ScoreBreakdown({ score }: { score: AIScoreResponse & { modelUsed?: string } }) {
  const tier = scoreTierFromScore(score.overallScore);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Score</CardTitle>
            <CardDescription>{score.explanation}</CardDescription>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold">{Math.round(score.overallScore)}</p>
            <ScoreTierBadge tier={tier} className="mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div variants={staggerContainer()} initial="hidden" animate="visible" className="space-y-3">
          {DIMENSIONS.map((dim) => (
            <motion.div key={dim.key} variants={fadeInUp} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{dim.label}</span>
                <span className="font-medium tabular-nums">{Math.round(score[dim.key] as number)}</span>
              </div>
              <Progress value={score[dim.key] as number} />
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-secondary p-3 text-sm">
          <span className="text-muted-foreground">Suggested price</span>
          <span className="font-semibold">{Math.round(score.suggestedPrice)} pts</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Confidence: {Math.round(score.confidenceScore * 100)}%
          {score.modelUsed === "mock" && " · placeholder score (no AI provider configured)"}
        </p>
      </CardContent>
    </Card>
  );
}
