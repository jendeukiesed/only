import { Heart } from "lucide-react";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { WishlistRemoveButton } from "@/features/buyer/components/wishlist-remove-button";
import { SavedSearchAlertsPanel } from "@/features/buyer/components/saved-search-alerts-panel";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requireBuyer();

  const [items, alerts] = await Promise.all([
    db.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { photo: { select: photoCardSelect } },
    }),
    db.savedSearchAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mystery photos you've saved to unlock later.
        </p>
      </div>

      <SavedSearchAlertsPanel alerts={alerts} />

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Save mystery listings from the marketplace to come back to them later."
          action={{ label: "Browse marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <PhotoCard
              key={item.id}
              photo={toPhotoCardData(item.photo)}
              variant="locked"
              actions={<WishlistRemoveButton photoId={item.photoId} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
