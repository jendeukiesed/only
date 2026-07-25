import { History } from "lucide-react";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { PointsDisplay } from "@/components/shared/points-display";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, titleCaseEnum } from "@/utils/format";

export const metadata = { title: "Purchase history" };

export default async function HistoryPage() {
  const user = await requireBuyer();

  const transactions = await db.pointTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Purchase history</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every point transaction on your account.</p>
      </div>

      {transactions.length === 0 ? (
        <EmptyState icon={History} title="No transactions yet" description="Your point activity will show up here." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                <TableCell>{titleCaseEnum(tx.type)}</TableCell>
                <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                <TableCell className="text-right">
                  <PointsDisplay amount={tx.amount} size="sm" signed />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{tx.balanceAfter.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
