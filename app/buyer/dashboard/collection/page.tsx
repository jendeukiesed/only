import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";

export const metadata = { title: "My collection" };

export default async function CollectionPage() {
  const user = await requireBuyer();

  const unlocks = await db.mysteryUnlock.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { photo: { select: photoCardSelect } },
  });

  // A buyer can unlock the same photo more than once (mystery draws aren't
  // guaranteed distinct) — the collection view shows each distinct photo
  // once, keeping the most recent unlock's timestamp.
  const seen = new Set<string>();
  const distinctPhotos = unlocks.filter((u) => {
    if (seen.has(u.photoId)) return false;
    seen.add(u.photoId);
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My collection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {distinctPhotos.length} unlocked photo{distinctPhotos.length === 1 ? "" : "s"}
          {unlocks.length !== distinctPhotos.length && ` (${unlocks.length} total unlocks)`}
        </p>
      </div>

      {distinctPhotos.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Your collection is empty"
          description="Unlock mystery photos in the marketplace to start building your collection."
          action={{ label: "Browse marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {distinctPhotos.map((unlock) => (
            <Link key={unlock.id} href={`/buyer/dashboard/collection/${unlock.photoId}`}>
              <PhotoCard photo={toPhotoCardData(unlock.photo)} variant="unlocked" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
