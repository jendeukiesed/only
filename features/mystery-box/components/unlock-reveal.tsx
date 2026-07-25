"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreTierBadge } from "@/components/shared/score-tier-badge";
import { PointsDisplay } from "@/components/shared/points-display";
import { unlockPhotoAction } from "@/actions/marketplace/unlock";
import { mysteryRevealVariants } from "@/lib/constants/motion";
import { titleCaseEnum } from "@/utils/format";
import type { PhotoCardData } from "@/types/photo";

type Phase = "sealed" | "anticipation" | "revealed";

export function UnlockReveal({ photo }: { photo: PhotoCardData }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("sealed");
  const [revealedUrl, setRevealedUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleUnlock() {
    setIsPending(true);
    setPhase("anticipation");

    const result = await unlockPhotoAction(photo.id);

    if (!result.success) {
      toast.error(result.message);
      setPhase("sealed");
      setIsPending(false);
      return;
    }

    // Let the anticipation beat play for a moment before the reveal —
    // purely a "reward feeling" delay, the mutation has already committed.
    setTimeout(() => {
      setRevealedUrl(result.photoUrl!);
      setPhase("revealed");
      setIsPending(false);
      toast.success("Unlocked! Added to your collection.");
    }, 700);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-premium-lg">
        <AnimatePresence mode="wait">
          {phase !== "revealed" ? (
            <motion.div
              key="locked"
              variants={mysteryRevealVariants}
              animate={phase === "anticipation" ? "anticipation" : "sealed"}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blurred preview */}
              <img src={photo.blurredUrl} alt="Mystery photo" className="size-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <div className="glass glass-border flex size-16 items-center justify-center rounded-full">
                  <Lock className="size-7" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              variants={mysteryRevealVariants}
              initial="hidden"
              animate="revealed"
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- reveal */}
              <img src={revealedUrl ?? photo.url} alt={photo.title} className="size-full object-cover" />
              <div className="absolute right-3 top-3">
                <Badge variant="success">
                  <Sparkles className="size-3" /> Unlocked
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {photo.scoreTier && <ScoreTierBadge tier={photo.scoreTier} />}
        {photo.breed && <Badge variant="outline">{photo.breed}</Badge>}
        {photo.energyLevel && <Badge variant="outline">{titleCaseEnum(photo.energyLevel)}</Badge>}
      </div>

      {phase !== "revealed" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            From <span className="font-medium text-foreground">@{photo.seller.username}</span> · reputation{" "}
            {photo.seller.reputationScore.toFixed(1)}
          </p>
          <Button variant="brand" size="lg" onClick={handleUnlock} disabled={isPending} className="w-full">
            <Lock className="size-4" />
            {isPending ? "Unlocking…" : (
              <>
                Unlock for <PointsDisplay amount={photo.price} size="sm" className="text-brand-foreground" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center gap-3">
          <Button variant="brand" onClick={() => router.push("/buyer/dashboard/collection")}>
            View in collection
          </Button>
          <Button variant="outline" onClick={() => router.push("/marketplace")}>
            Keep browsing
          </Button>
        </div>
      )}
    </div>
  );
}
