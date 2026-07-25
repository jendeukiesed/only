import Link from "next/link";
import { Medal } from "lucide-react";
import { db } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { formatDate, titleCaseEnum } from "@/utils/format";

export const metadata = { title: "Contests" };

const STATUS_BADGE: Record<string, "success" | "warning" | "secondary"> = {
  ACTIVE: "success",
  UPCOMING: "warning",
  COMPLETED: "secondary",
};

export default async function ContestsPage() {
  const contests = await db.contest.findMany({
    where: { status: { in: ["ACTIVE", "UPCOMING", "COMPLETED"] } },
    orderBy: [{ status: "asc" }, { startsAt: "desc" }],
    take: 30,
    include: { _count: { select: { entries: true } } },
  });

  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Photo contests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real photos from real creators, judged by the community's votes.
        </p>
      </div>

      {contests.length === 0 ? (
        <EmptyState icon={Medal} title="No contests yet" description="Check back soon for the next one." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <Link key={contest.id} href={`/contests/${contest.id}`}>
              <Card className="h-full transition-shadow hover:shadow-premium-lg">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant={STATUS_BADGE[contest.status] ?? "secondary"}>{titleCaseEnum(contest.status)}</Badge>
                    <span className="text-xs text-muted-foreground">{titleCaseEnum(contest.period)}</span>
                  </div>
                  <p className="font-display text-sm font-semibold">{contest.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{contest.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {contest._count.entries} {contest._count.entries === 1 ? "entry" : "entries"} · ends {formatDate(contest.endsAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
