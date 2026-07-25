"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { SearchX } from "lucide-react";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { PhotoGridSkeleton } from "@/components/shared/skeletons/photo-card-skeleton";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { useMarketplacePhotos } from "@/features/marketplace/hooks/use-marketplace-photos";
import type { MarketplaceFilters, MarketplaceSort } from "@/schemas/marketplace.schema";

export function MarketplaceGrid({ categorySlug }: { categorySlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ref, inView } = useInView();

  const filters: Omit<Partial<MarketplaceFilters>, "cursor"> = {
    query: searchParams.get("query") ?? undefined,
    breed: searchParams.get("breed") ?? undefined,
    ageCategory: (searchParams.get("ageCategory") as MarketplaceFilters["ageCategory"]) ?? undefined,
    energyLevel: (searchParams.get("energyLevel") as MarketplaceFilters["energyLevel"]) ?? undefined,
    color: searchParams.get("color") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sort: (searchParams.get("sort") as MarketplaceSort) ?? "newest",
    categorySlug,
  };

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMarketplacePhotos(filters);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <PhotoGridSkeleton count={12} />;

  const photos = data?.pages.flatMap((page) => page.photos) ?? [];

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No photos match your filters"
        description="Try widening your search or clearing a few filters."
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            variant="locked"
            onUnlock={() => router.push(`/mystery/${photo.id}`)}
          />
        ))}
      </div>
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isFetchingNextPage && <PhotoGridSkeleton count={4} />}
        </div>
      )}
    </div>
  );
}
