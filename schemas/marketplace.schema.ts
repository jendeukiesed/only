import { z } from "zod";
import { AgeCategory, EnergyLevel } from "@prisma/client";

export const marketplaceSortSchema = z.enum([
  "newest",
  "trending",
  "highest_score",
  "lowest_price",
]);
export type MarketplaceSort = z.infer<typeof marketplaceSortSchema>;

export const marketplaceFiltersSchema = z.object({
  query: z.string().max(100).optional(),
  categorySlug: z.string().optional(),
  breed: z.string().optional(),
  ageCategory: z.nativeEnum(AgeCategory).optional(),
  energyLevel: z.nativeEnum(EnergyLevel).optional(),
  color: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: marketplaceSortSchema.default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});
export type MarketplaceFilters = z.infer<typeof marketplaceFiltersSchema>;
