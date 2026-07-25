import { Wallet } from "lucide-react";
import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { StatCard } from "@/components/shared/cards/stat-card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { PointsDisplay } from "@/components/shared/points-display";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPoints } from "@/utils/format";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const user = await requireSeller();

  const [transactions, lifetimeAgg, pointsBalance] = await Promise.all([
    db.pointTransaction.findMany({
      where: { userId: user.id, type: "SALE_EARNING" },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.pointTransaction.aggregate({
      where: { userId: user.id, type: "SALE_EARNING" },
      _sum: { amount: true },
      _count: true,
    }),
    db.user.findUnique({ where: { id: user.id }, select: { pointsBalance: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Points earned from mystery unlocks of your photos.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Current balance" value={formatPoints(pointsBalance?.pointsBalance ?? 0)} icon={Wallet} />
        <StatCard label="Lifetime earnings" value={formatPoints(lifetimeAgg._sum.amount ?? 0)} icon={Wallet} />
        <StatCard label="Total sales" value={String(lifetimeAgg._count)} icon={Wallet} />
      </div>

      {transactions.length === 0 ? (
        <EmptyState icon={Wallet} title="No earnings yet" description="Earnings appear here as buyers unlock your photos." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                <TableCell className="max-w-sm truncate">{tx.description}</TableCell>
                <TableCell className="text-right">
                  <PointsDisplay amount={tx.amount} size="sm" signed />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
