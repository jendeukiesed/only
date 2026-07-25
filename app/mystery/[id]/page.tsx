import { notFound } from "next/navigation";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { UnlockReveal } from "@/features/mystery-box/components/unlock-reveal";
import { photoCardSelect, toPhotoCardData } from "@/services/marketplace/photo-mapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Mystery unlock" };

export default async function MysteryPage({ params }: PageProps) {
  await requireBuyer();
  const { id } = await params;

  const photo = await db.photo.findUnique({
    where: { id, status: "APPROVED" },
    select: photoCardSelect,
  });
  if (!photo) notFound();

  return (
    <div className="container py-12">
      <UnlockReveal photo={toPhotoCardData(photo)} />
    </div>
  );
}
