import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRowActions } from "@/features/admin/components/user-row-actions";
import { formatPoints, formatDate } from "@/utils/format";

export const metadata = { title: "Users" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const STATUS_VARIANT = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "destructive",
  PENDING_VERIFICATION: "outline",
} as const;

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q } = await searchParams;

  const users = await db.user.findMany({
    where: q
      ? { OR: [{ username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      username: true,
      email: true,
      roles: true,
      status: true,
      pointsBalance: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{users.length} accounts.</p>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by username or email…"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <p className="font-medium">@{u.username}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px]">
                      {r}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPoints(u.pointsBalance)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
              <TableCell>
                <UserRowActions userId={u.id} status={u.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
