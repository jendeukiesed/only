import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/prisma";
import { SearchBar } from "@/features/marketplace/components/search-bar";
import { SortSelect } from "@/features/marketplace/components/sort-select";
import { FiltersSidebar } from "@/features/marketplace/components/filters-sidebar";
import { MarketplaceGrid } from "@/features/marketplace/components/marketplace-grid";
import { PhotoGridSkeleton } from "@/components/shared/skeletons/photo-card-skeleton";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const record = await db.category.findUnique({ where: { slug: category }, select: { name: true } });
  return { title: record?.name ?? "Marketplace" };
}

export default async function MarketplaceCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const record = await db.category.findUnique({ where: { slug: category } });
  if (!record) notFound();

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {record.icon} {record.name}
        </h1>
        {record.description && <p className="mt-1 text-sm text-muted-foreground">{record.description}</p>}
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:max-w-sm sm:flex-1">
            <SearchBar />
          </div>
          <SortSelect />
        </div>
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-secondary/40" />}>
          <FiltersSidebar />
        </Suspense>
        <Suspense fallback={<PhotoGridSkeleton count={12} />}>
          <MarketplaceGrid categorySlug={record.slug} />
        </Suspense>
      </div>
    </div>
  );
}
