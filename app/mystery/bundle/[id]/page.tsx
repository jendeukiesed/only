import { notFound } from "next/navigation";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { BundleReveal } from "@/features/mystery-box/components/bundle-reveal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Mystery bundle" };

export default async function BundleMysteryPage({ params }: PageProps) {
  await requireBuyer();
  const { id } = await params;

  const bundle = await db.bundle.findUnique({
    where: { id, isActive: true },
    include: { photos: { include: { photo: { select: { id: true, title: true, blurredUrl: true, url: true } } } } },
  });
  if (!bundle) notFound();

  return (
    <div className="container py-12">
      <BundleReveal
        bundleId={bundle.id}
        title={bundle.title}
        price={bundle.price}
        photos={bundle.photos.map((bp) => bp.photo)}
      />
    </div>
  );
}
