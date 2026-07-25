import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeaturedForm } from "@/features/admin/components/featured-form";
import { formatDate } from "@/utils/format";

export const metadata = { title: "Featured creators" };

export default async function FeaturedPage() {
  await requireAdmin();

  const [sellers, featured] = await Promise.all([
    db.user.findMany({ where: { roles: { has: Role.SELLER } }, select: { id: true, username: true }, orderBy: { username: "asc" } }),
    db.featuredCreator.findMany({
      orderBy: { startAt: "desc" },
      include: { seller: { select: { username: true } } },
    }),
  ]);

  const now = new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Featured creators</h1>
        <p className="mt-1 text-sm text-muted-foreground">Spotlight creators on the homepage.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <FeaturedForm sellers={sellers} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {featured.length === 0 && <p className="p-5 text-sm text-muted-foreground">No featured creators yet.</p>}
          {featured.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">@{f.seller.username}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(f.startAt)} – {formatDate(f.endAt)}
                </p>
              </div>
              <Badge variant={f.endAt > now ? "success" : "outline"}>{f.endAt > now ? "Active" : "Expired"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
