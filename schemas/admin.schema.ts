import { z } from "zod";

export const rejectPhotoSchema = z.object({
  photoId: z.string().min(1),
  reason: z.string().min(3, "Give a reason so the seller can improve.").max(300),
});

export const moderationActionSchema = z.object({
  photoId: z.string().min(1),
});

export const suspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(3).max(300),
});

export const banUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(3).max(300),
});

export const adjustPointsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().refine((v) => v !== 0, "Amount can't be zero."),
  reason: z.string().min(3).max(300),
});

export const resolveReportSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["ACTION_TAKEN", "DISMISSED"]),
  resolutionNote: z.string().max(500).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional().or(z.literal("")),
  icon: z.string().max(10).optional().or(z.literal("")),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(3).max(2000),
  expiresAt: z.string().optional(),
});

export const updatePlatformSettingSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

export const createContestSchema = z
  .object({
    title: z.string().min(3).max(120),
    description: z.string().min(3).max(1000),
    period: z.enum(["WEEKLY", "MONTHLY"]),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    firstPrizePoints: z.number().int().min(0).max(5000).default(200),
    secondPrizePoints: z.number().int().min(0).max(5000).default(100),
    thirdPrizePoints: z.number().int().min(0).max(5000).default(50),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End date must be after the start date.",
    path: ["endsAt"],
  });
export type CreateContestInput = z.infer<typeof createContestSchema>;
