import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { RewardCatalog } from "@/features/rewards/components/reward-catalog";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { Gift } from "lucide-react";

export const metadata = { title: "Rewards" };

export default async function SellerRewardsPage() {
  const user = await requireSeller();

  const [pointsBalance, items] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { pointsBalance: true } }).then((u) => u?.pointsBalance ?? 0),
    // Sellers see the full catalog — cosmetic badges plus the two
    // seller-only categories (feature boost, commission discount).
    db.rewardItem.findMany({ where: { isActive: true }, orderBy: { pointsCost: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Rewards catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Redeem points for profile badges, a featured-creator boost, or a temporary commission discount.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Gift} title="No rewards available right now" description="Check back soon." />
      ) : (
        <RewardCatalog items={items} pointsBalance={pointsBalance} />
      )}
    </div>
  );
}
