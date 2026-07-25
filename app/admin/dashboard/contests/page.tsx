import Link from "next/link";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContestForm } from "@/features/admin/components/contest-form";
import { formatDate, titleCaseEnum } from "@/utils/format";

export const metadata = { title: "Contests" };

export default async function AdminContestsPage() {
  await requireAdmin();

  const contests = await db.contest.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Contests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a real-photo voting contest. Entries only ever come from sellers' existing approved listings.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <ContestForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {contests.length === 0 && <p className="p-5 text-sm text-muted-foreground">No contests yet.</p>}
          {contests.map((c) => (
            <Link key={c.id} href={`/contests/${c.id}`} className="flex items-center justify-between p-4 hover:bg-secondary/40">
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(c.startsAt)} – {formatDate(c.endsAt)} · {c._count.entries} entries
                </p>
              </div>
              <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "UPCOMING" ? "warning" : "secondary"}>
                {titleCaseEnum(c.status)}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
