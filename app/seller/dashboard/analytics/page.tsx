import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { StatCard } from "@/components/shared/cards/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/features/seller/components/performance-chart";
import { Star, Eye, TrendingUp } from "lucide-react";
import { formatPoints } from "@/utils/format";

export const metadata = { title: "Analytics" };

const MONTHS_BACK = 6;

export default async function AnalyticsPage() {
  const user = await requireSeller();

  const since = new Date();
  since.setMonth(since.getMonth() - (MONTHS_BACK - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [earningsTx, unlocks, topPhotos, avgScoreAgg] = await Promise.all([
    db.pointTransaction.findMany({
      where: { userId: user.id, type: "SALE_EARNING", createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
    }),
    db.mysteryUnlock.findMany({
      where: { photo: { sellerId: user.id }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.photo.findMany({
      where: { sellerId: user.id, status: "APPROVED" },
      orderBy: { unlockCount: "desc" },
      take: 5,
      select: { id: true, title: true, unlockCount: true, overallScore: true },
    }),
    db.photo.aggregate({
      where: { sellerId: user.id, status: "APPROVED" },
      _avg: { overallScore: true },
    }),
  ]);

  const buckets = new Map<string, { earnings: number; unlocks: number }>();
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(monthKey(d), { earnings: 0, unlocks: 0 });
  }
  for (const tx of earningsTx) {
    const key = monthKey(tx.createdAt);
    const bucket = buckets.get(key);
    if (bucket) bucket.earnings += tx.amount;
  }
  for (const u of unlocks) {
    const key = monthKey(u.createdAt);
    const bucket = buckets.get(key);
    if (bucket) bucket.unlocks += 1;
  }
  const chartData = Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance over the last {MONTHS_BACK} months.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Points earned (6mo)" value={formatPoints(earningsTx.reduce((s, t) => s + t.amount, 0))} icon={TrendingUp} />
        <StatCard label="Unlocks (6mo)" value={String(unlocks.length)} icon={Eye} />
        <StatCard label="Avg. score" value={avgScoreAgg._avg.overallScore ? Math.round(avgScoreAgg._avg.overallScore).toString() : "—"} icon={Star} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings & unlocks</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top uploads</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {topPhotos.length === 0 && <p className="p-5 text-sm text-muted-foreground">No approved uploads yet.</p>}
          {topPhotos.map((photo, i) => (
            <div key={photo.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {i + 1}
                </span>
                <p className="text-sm font-medium">{photo.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{photo.unlockCount} unlocks</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function monthKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
