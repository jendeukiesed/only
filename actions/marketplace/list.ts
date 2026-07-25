"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { marketplaceFiltersSchema, type MarketplaceFilters } from "@/schemas/marketplace.schema";
import { photoCardSelect, toPhotoCardData } from "@/services/marketplace/photo-mapper";

const SORT_ORDER_BY: Record<string, Prisma.PhotoOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  trending: { unlockCount: "desc" },
  highest_score: { overallScore: "desc" },
  lowest_price: { price: "asc" },
};

/**
 * Backs both the initial marketplace page render and every "load more"
 * page an infinite-scroll client triggers (features/marketplace/hooks/
 * use-marketplace-photos.ts calls this directly as a TanStack Query
 * queryFn — Server Actions are just callable async functions, no separate
 * REST route needed). `cursor` here is a simple stringified offset, not a
 * Prisma cursor object, so pagination works uniformly across every sort
 * order (a real keyset cursor would need to vary its shape per sort field).
 */
export async function getMarketplacePhotosAction(filters: Partial<MarketplaceFilters>) {
  const parsed = marketplaceFiltersSchema.parse(filters);
  const offset = parsed.cursor ? Number(parsed.cursor) : 0;

  const where: Prisma.PhotoWhereInput = {
    status: "APPROVED",
    ...(parsed.categorySlug ? { category: { slug: parsed.categorySlug } } : {}),
    ...(parsed.breed ? { breed: { equals: parsed.breed, mode: "insensitive" } } : {}),
    ...(parsed.ageCategory ? { ageCategory: parsed.ageCategory } : {}),
    ...(parsed.energyLevel ? { energyLevel: parsed.energyLevel } : {}),
    ...(parsed.color ? { color: { equals: parsed.color, mode: "insensitive" } } : {}),
    ...(parsed.minPrice !== undefined || parsed.maxPrice !== undefined
      ? { price: { gte: parsed.minPrice ?? 0, lte: parsed.maxPrice ?? 100000 } }
      : {}),
    ...(parsed.query
      ? {
          OR: [
            { title: { contains: parsed.query, mode: "insensitive" } },
            { breed: { contains: parsed.query, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: parsed.query, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const [photos, total] = await Promise.all([
    db.photo.findMany({
      where,
      select: photoCardSelect,
      orderBy: SORT_ORDER_BY[parsed.sort] ?? SORT_ORDER_BY.newest,
      skip: offset,
      take: parsed.limit,
    }),
    db.photo.count({ where }),
  ]);

  if (parsed.query) {
    await db.searchQuery.create({
      data: { query: parsed.query, resultsCount: total },
    });
  }

  const nextOffset = offset + photos.length;
  return {
    photos: photos.map(toPhotoCardData),
    nextCursor: nextOffset < total ? String(nextOffset) : null,
    total,
  };
}
