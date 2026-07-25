import { z } from "zod";
import { AgeCategory, EnergyLevel } from "@prisma/client";

export const createPhotoSchema = z.object({
  title: z.string().min(3, "Give it a title.").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  cloudinaryPublicId: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  breed: z.string().max(60).optional().or(z.literal("")),
  ageCategory: z.nativeEnum(AgeCategory).optional(),
  energyLevel: z.nativeEnum(EnergyLevel).optional(),
  color: z.string().max(40).optional().or(z.literal("")),
  categoryId: z.string().optional(),
  tags: z.array(z.string().min(1).max(30)).max(8).optional(),
});
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;

export const editPhotoSchema = z.object({
  photoId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  price: z.number().int().min(1).max(500),
});
export type EditPhotoInput = z.infer<typeof editPhotoSchema>;
