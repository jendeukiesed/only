import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryForm } from "@/features/admin/components/category-form";
import { CategoryToggle } from "@/features/admin/components/category-toggle";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { photos: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage marketplace breed/category taxonomy.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <CategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">
                  {c.icon} {c.name}
                </p>
                <p className="text-xs text-muted-foreground">{c._count.photos} photos</p>
              </div>
              <CategoryToggle categoryId={c.id} isActive={c.isActive} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
