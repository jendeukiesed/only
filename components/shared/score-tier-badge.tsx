import { ScoreTier } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TIER_CONFIG: Record<ScoreTier, { label: string; variant: "bronze" | "silver" | "gold" | "platinum" | "legendary" }> = {
  BRONZE: { label: "Bronze", variant: "bronze" },
  SILVER: { label: "Silver", variant: "silver" },
  GOLD: { label: "Gold", variant: "gold" },
  PLATINUM: { label: "Platinum", variant: "platinum" },
  LEGENDARY: { label: "Legendary", variant: "legendary" },
};

export function ScoreTierBadge({ tier, className }: { tier: ScoreTier; className?: string }) {
  const config = TIER_CONFIG[tier];
  return (
    <Badge variant={config.variant} className={cn("font-semibold", className)}>
      {config.label}
    </Badge>
  );
}

// scoreTierFromScore() moved to utils/score-tier.ts — this file is
// presentational only, so both the ai-scoring service and any Client
// Component can import the mapping without pulling UI code into a
// server-only service.
export { scoreTierFromScore } from "@/utils/score-tier";
