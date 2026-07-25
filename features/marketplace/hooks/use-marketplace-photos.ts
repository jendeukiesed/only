"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getMarketplacePhotosAction } from "@/actions/marketplace/list";
import type { MarketplaceFilters } from "@/schemas/marketplace.schema";

/**
 * Infinite-scroll data source for the marketplace grid. The queryFn calls
 * the Server Action directly — no separate REST route needed, TanStack
 * Query treats it like any other async function and handles caching,
 * deduping, and the `hasNextPage`/`fetchNextPage` plumbing for us.
 */
export function useMarketplacePhotos(filters: Omit<Partial<MarketplaceFilters>, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["marketplace-photos", filters],
    queryFn: ({ pageParam }) => getMarketplacePhotosAction({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
