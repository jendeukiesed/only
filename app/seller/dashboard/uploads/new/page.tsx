import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { UploadForm } from "@/features/seller/components/upload-form";

export const metadata = { title: "Upload a photo" };

export default async function NewUploadPage() {
  await requireSeller();
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Upload a photo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Our AI scores every upload instantly. An admin still reviews it before it goes live.
        </p>
      </div>
      <UploadForm categories={categories} />
    </div>
  );
}
