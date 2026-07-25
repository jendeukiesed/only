import Link from "next/link";
import { Clock, Flag, Users, ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { StatCard } from "@/components/shared/cards/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/utils/format";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [pendingPhotos, pendingReports, totalUsers, liveListings, recentReports] = await Promise.all([
    db.photo.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.user.count(),
    db.photo.count({ where: { status: "APPROVED" } }),
    db.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { reporter: { select: { username: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending review" value={String(pendingPhotos)} icon={Clock} />
        <StatCard label="Pending reports" value={String(pendingReports)} icon={Flag} />
        <StatCard label="Total users" value={String(totalUsers)} icon={Users} />
        <StatCard label="Live listings" value={String(liveListings)} icon={ImageIcon} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent reports</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard/reports">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {recentReports.length === 0 && <p className="p-5 text-sm text-muted-foreground">No pending reports.</p>}
          {recentReports.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{r.targetType} report</p>
                <p className="text-xs text-muted-foreground">
                  by @{r.reporter.username} · {formatRelativeTime(r.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
