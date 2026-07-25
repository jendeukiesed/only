import { z } from "zod";

export const createCommentSchema = z.object({
  photoId: z.string().min(1),
  body: z.string().min(1, "Comment can't be empty.").max(1000),
  parentId: z.string().optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Give your collection a name.").max(60),
  description: z.string().max(300).optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
