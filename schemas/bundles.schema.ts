import { z } from "zod";

export const createBundleSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(500),
  price: z.number().int().min(1).max(2000),
  photoIds: z.array(z.string().min(1)).min(2, "A bundle needs at least 2 photos.").max(10),
});
export type CreateBundleInput = z.infer<typeof createBundleSchema>;
