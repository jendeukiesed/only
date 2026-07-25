"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Award, Rocket, Percent } from "lucide-react";
import { RewardCategory } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PointsDisplay } from "@/components/shared/points-display";
import { redeemRewardAction } from "@/actions/rewards/redeem";

interface RewardItemData {
  id: string;
  key: string;
  name: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
}

const CATEGORY_ICON: Record<RewardCategory, typeof Award> = {
  PROFILE_BADGE: Award,
  FEATURE_BOOST: Rocket,
  COMMISSION_DISCOUNT: Percent,
};

export function RewardCatalog({ items, pointsBalance }: { items: RewardItemData[]; pointsBalance: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRedeem(rewardItemId: string) {
    startTransition(async () => {
      const result = await redeemRewardAction({ rewardItemId });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't redeem this reward.");
        return;
      }
      toast.success("Reward redeemed!");
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = CATEGORY_ICON[item.category];
        const canAfford = pointsBalance >= item.pointsCost;
        return (
          <Card key={item.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10">
                <Icon className="size-5 text-brand" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <PointsDisplay amount={item.pointsCost} />
                <Button
                  size="sm"
                  variant="brand"
                  disabled={isPending || !canAfford}
                  onClick={() => handleRedeem(item.id)}
                >
                  {canAfford ? "Redeem" : "Not enough points"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
