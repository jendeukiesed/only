import { z } from "zod";
import { AgeCategory, EnergyLevel } from "@prisma/client";

export const updateBuyerProfileSchema = z.object({
  name: z.string().min(2, "Enter your full name.").max(80),
  bio: z.string().max(500, "Bio must be 500 characters or fewer.").optional().or(z.literal("")),
  image: z.string().url("Enter a valid image URL.").optional().or(z.literal("")),
});
export type UpdateBuyerProfileInput = z.infer<typeof updateBuyerProfileSchema>;

export const toggleWishlistSchema = z.object({
  photoId: z.string().min(1),
});

export const createSavedSearchAlertSchema = z.object({
  breed: z.string().trim().max(60).optional().or(z.literal("")),
  ageCategory: z.nativeEnum(AgeCategory).optional(),
  energyLevel: z.nativeEnum(EnergyLevel).optional(),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  maxPrice: z.number().int().min(1).max(500).optional(),
});
export type CreateSavedSearchAlertInput = z.infer<typeof createSavedSearchAlertSchema>;
