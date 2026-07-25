import { Flag } from "lucide-react";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { ReportRowActions } from "@/features/admin/components/report-row-actions";
import { formatRelativeTime, titleCaseEnum } from "@/utils/format";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireAdmin();

  const reports = await db.report.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { username: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">{reports.length} pending reports.</p>
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={Flag} title="No pending reports" description="You're all caught up." />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.targetType}</Badge>
                      <Badge variant="warning">{titleCaseEnum(report.reason)}</Badge>
                    </div>
                    <p className="mt-2 text-sm">{report.details ?? "No additional details provided."}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reported by @{report.reporter.username} · {formatRelativeTime(report.createdAt)}
                    </p>
                  </div>
                </div>
                <ReportRowActions reportId={report.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
