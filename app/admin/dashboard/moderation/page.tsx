import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { ModerationCard } from "@/features/admin/components/moderation-card";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";

export const metadata = { title: "Moderation" };

export default async function ModerationPage() {
  await requireAdmin();

  const photos = await db.photo.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: photoCardSelect,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Moderation queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">{photos.length} photos awaiting review.</p>
      </div>

      {photos.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Queue is clear" description="No photos are waiting for review right now." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <ModerationCard key={photo.id} photo={toPhotoCardData(photo)} />
          ))}
        </div>
      )}
    </div>
  );
}
