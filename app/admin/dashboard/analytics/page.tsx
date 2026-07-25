import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { StatCard } from "@/components/shared/cards/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/features/seller/components/performance-chart";
import { Users, Image as ImageIcon, Repeat, Coins } from "lucide-react";
import { formatPoints } from "@/utils/format";

export const metadata = { title: "Platform analytics" };

const MONTHS_BACK = 6;

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const since = new Date();
  since.setMonth(since.getMonth() - (MONTHS_BACK - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [userCount, approvedPhotoCount, totalUnlocks, commissionAgg, unlocksInRange] = await Promise.all([
    db.user.count(),
    db.photo.count({ where: { status: "APPROVED" } }),
    db.mysteryUnlock.count(),
    db.mysteryUnlock.aggregate({ _sum: { platformFee: true } }),
    db.mysteryUnlock.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, platformFee: true },
    }),
  ]);

  const buckets = new Map<string, { earnings: number; unlocks: number }>();
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), { earnings: 0, unlocks: 0 });
  }
  for (const u of unlocksInRange) {
    const key = u.createdAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.earnings += u.platformFee;
      bucket.unlocks += 1;
    }
  }
  const chartData = Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Platform analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide activity over the last {MONTHS_BACK} months.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={formatPoints(userCount)} icon={Users} />
        <StatCard label="Live photos" value={formatPoints(approvedPhotoCount)} icon={ImageIcon} />
        <StatCard label="Total unlocks" value={formatPoints(totalUnlocks)} icon={Repeat} />
        <StatCard label="Commission earned" value={formatPoints(commissionAgg._sum.platformFee ?? 0)} icon={Coins} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission & unlocks</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
