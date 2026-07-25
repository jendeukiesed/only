import { Suspense } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { SearchBar } from "@/features/marketplace/components/search-bar";
import { SortSelect } from "@/features/marketplace/components/sort-select";
import { FiltersSidebar } from "@/features/marketplace/components/filters-sidebar";
import { MarketplaceGrid } from "@/features/marketplace/components/marketplace-grid";
import { PhotoGridSkeleton } from "@/components/shared/skeletons/photo-card-skeleton";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Unlock mystery dog photos with points.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/marketplace/bundles">
            <Package className="size-4" /> Browse bundles
          </Link>
        </Button>
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
          <MarketplaceGrid />
        </Suspense>
      </div>
    </div>
  );
}
