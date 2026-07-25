import { z } from "zod";

export const submitContestEntrySchema = z.object({
  contestId: z.string().min(1),
  photoId: z.string().min(1),
});
export type SubmitContestEntryInput = z.infer<typeof submitContestEntrySchema>;

export const voteContestEntrySchema = z.object({
  entryId: z.string().min(1),
});
