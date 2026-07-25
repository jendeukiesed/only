import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BundleForm } from "@/features/admin/components/bundle-form";
import { formatDate } from "@/utils/format";

export const metadata = { title: "Bundles" };

export default async function AdminBundlesPage() {
  await requireAdmin();

  const [candidatePhotos, bundles] = await Promise.all([
    db.photo.findMany({
      where: { status: "APPROVED" },
      select: { id: true, title: true, price: true, seller: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.bundle.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true, unlocks: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mystery bundles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate a discounted, multi-photo bundle from existing approved listings.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <BundleForm
            candidatePhotos={candidatePhotos.map((p) => ({
              id: p.id,
              title: p.title,
              price: p.price,
              sellerUsername: p.seller.username,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {bundles.length === 0 && <p className="p-5 text-sm text-muted-foreground">No bundles yet.</p>}
          {bundles.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-xs text-muted-foreground">
                  {b._count.photos} photos · {b._count.unlocks} purchases · created {formatDate(b.createdAt)}
                </p>
              </div>
              <Badge variant={b.isActive ? "success" : "outline"}>{b.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
