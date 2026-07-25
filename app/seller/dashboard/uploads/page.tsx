import Link from "next/link";
import { Upload as UploadIcon } from "lucide-react";
import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { WithdrawButton } from "@/features/seller/components/withdraw-button";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";
import type { UploadStatus } from "@prisma/client";

export const metadata = { title: "My uploads" };

async function getUploadsByStatus(sellerId: string, status: UploadStatus) {
  const photos = await db.photo.findMany({
    where: { sellerId, status },
    orderBy: { createdAt: "desc" },
    select: photoCardSelect,
  });
  return photos.map(toPhotoCardData);
}

export default async function UploadsPage() {
  const user = await requireSeller();

  const [pending, approved, rejected] = await Promise.all([
    getUploadsByStatus(user.id, "PENDING"),
    getUploadsByStatus(user.id, "APPROVED"),
    getUploadsByStatus(user.id, "REJECTED"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">My uploads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your submitted photos.</p>
        </div>
        <Button variant="brand" asChild>
          <Link href="/seller/dashboard/uploads/new">
            <UploadIcon className="size-4" /> Upload photo
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <UploadGrid photos={pending} emptyMessage="No photos awaiting review." />
        </TabsContent>
        <TabsContent value="approved">
          <UploadGrid photos={approved} emptyMessage="Nothing live in the marketplace yet." />
        </TabsContent>
        <TabsContent value="rejected">
          <UploadGrid photos={rejected} emptyMessage="No rejected photos." showReason />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UploadGrid({
  photos,
  emptyMessage,
  showReason,
}: {
  photos: ReturnType<typeof toPhotoCardData>[];
  emptyMessage: string;
  showReason?: boolean;
}) {
  if (photos.length === 0) {
    return <EmptyState icon={UploadIcon} title="Nothing here" description={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="space-y-2">
          <PhotoCard
            photo={photo}
            variant="seller"
            actions={photo.status === "APPROVED" ? <WithdrawButton photoId={photo.id} /> : undefined}
          />
          {showReason && photo.rejectionReason && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {photo.rejectionReason}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
