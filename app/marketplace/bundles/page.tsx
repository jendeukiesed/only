import Link from "next/link";
import { Package } from "lucide-react";
import { db } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { PointsDisplay } from "@/components/shared/points-display";

export const metadata = { title: "Mystery bundles" };

export default async function BundlesPage() {
  const bundles = await db.bundle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { photos: { include: { photo: { select: { blurredUrl: true, price: true } } } } },
  });

  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mystery bundles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Several mystery photos, one discounted purchase — all revealed together.
        </p>
      </div>

      {bundles.length === 0 ? (
        <EmptyState icon={Package} title="No bundles right now" description="Check back soon for a curated bundle." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => {
            const normalValue = bundle.photos.reduce((sum, bp) => sum + bp.photo.price, 0);
            const savingsPercent = normalValue > 0 ? Math.round((1 - bundle.price / normalValue) * 100) : 0;
            return (
              <Link
                key={bundle.id}
                href={`/mystery/bundle/${bundle.id}`}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-premium transition-shadow hover:shadow-premium-lg"
              >
                <div className="grid grid-cols-2 gap-0.5 bg-secondary p-0.5">
                  {bundle.photos.slice(0, 4).map((bp, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={bp.photo.blurredUrl} alt="" className="aspect-square w-full object-cover" />
                  ))}
                </div>
                <div className="space-y-2 p-4">
                  <p className="font-display text-sm font-semibold">{bundle.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{bundle.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <PointsDisplay amount={bundle.price} />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{bundle.photos.length} photos</Badge>
                      {savingsPercent > 0 && <Badge variant="success">Save {savingsPercent}%</Badge>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
