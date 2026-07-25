"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { createUploadSignature } from "@/services/cloudinary/sign-upload";
import { buildBlurredUrl } from "@/services/cloudinary/transform";
import { analyzePhoto } from "@/services/ai-scoring";
import { scoreTierFromScore } from "@/utils/score-tier";
import { createPhotoSchema, type CreatePhotoInput } from "@/schemas/seller.schema";
import { recordDailyActivity } from "@/services/gamification/activity";
import { computeImageHash, findLikelyDuplicate } from "@/services/moderation/perceptual-hash";

export async function getUploadSignatureAction() {
  const user = await assertRole(Role.SELLER);
  return createUploadSignature(`pawdrop/sellers/${user.id}`);
}

/**
 * Called after the browser has already uploaded the file directly to
 * Cloudinary (see getUploadSignatureAction). Creates the Photo row as
 * PENDING, runs it through the AI scoring service, and persists the
 * result — the photo still needs admin approval (Stage 11) before it's
 * visible in the marketplace, regardless of score.
 */
export async function createPhotoAction(input: CreatePhotoInput) {
  const user = await assertRole(Role.SELLER);
  const parsed = createPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const blurredUrl = buildBlurredUrl(data.url);

  const photo = await db.photo.create({
    data: {
      sellerId: user.id,
      title: data.title,
      description: data.description || null,
      cloudinaryPublicId: data.cloudinaryPublicId,
      url: data.url,
      blurredUrl,
      width: data.width,
      height: data.height,
      breed: data.breed || null,
      ageCategory: data.ageCategory,
      energyLevel: data.energyLevel,
      color: data.color || null,
      categoryId: data.categoryId || null,
      status: "PENDING",
      price: 10, // placeholder until scoring resolves; overwritten below
      tags: data.tags?.length
        ? {
            create: data.tags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: slugify(name) },
                  create: { name, slug: slugify(name) },
                },
              },
            })),
          }
        : undefined,
    },
  });

  let scoreResult: Awaited<ReturnType<typeof analyzePhoto>> | null = null;
  let moderationFlag: "SAFE" | "NEEDS_REVIEW" | "LIKELY_DUPLICATE" | "LIKELY_NOT_A_DOG" = "SAFE";

  try {
    scoreResult = await analyzePhoto(data.url);
    const scoreTier = scoreTierFromScore(scoreResult.overallScore);

    if (!scoreResult.isDogPhoto) {
      moderationFlag = "LIKELY_NOT_A_DOG";
    } else if (scoreResult.moderationNote) {
      moderationFlag = "NEEDS_REVIEW";
    }

    await db.$transaction([
      db.photoScore.create({
        data: {
          photoId: photo.id,
          overallScore: scoreResult.overallScore,
          cutenessScore: scoreResult.cutenessScore,
          compositionScore: scoreResult.compositionScore,
          lightingScore: scoreResult.lightingScore,
          sharpnessScore: scoreResult.sharpnessScore,
          emotionScore: scoreResult.emotionScore,
          colorBalanceScore: scoreResult.colorBalanceScore,
          suggestedPrice: scoreResult.suggestedPrice,
          confidenceScore: scoreResult.confidenceScore,
          explanation: scoreResult.explanation,
          modelUsed: scoreResult.modelUsed,
          isDogPhoto: scoreResult.isDogPhoto,
          moderationNote: scoreResult.moderationNote,
        },
      }),
      db.photo.update({
        where: { id: photo.id },
        data: {
          overallScore: scoreResult.overallScore,
          scoreTier,
          price: scoreResult.suggestedPrice,
          moderationFlag,
        },
      }),
    ]);
  } catch (error) {
    // The upload itself already succeeded — a scoring failure shouldn't
    // lose the seller's work. It just sits without a score until an admin
    // (or a retry action, future work) triggers scoring again.
    console.error("[seller/upload] scoring failed, photo saved unscored", { photoId: photo.id, error });
  }

  // Duplicate detection runs independently of AI scoring (and can't fail
  // the upload either) — a perceptual-hash match doesn't auto-reject, it
  // just raises the moderation flag so an admin double-checks it in the
  // moderation queue rather than a seller silently re-listing the same
  // photo under a new title/price.
  try {
    const hash = await computeImageHash(data.url);
    const duplicate = await findLikelyDuplicate(hash, photo.id);
    await db.photo.update({
      where: { id: photo.id },
      data: {
        imageHash: hash,
        duplicateOfPhotoId: duplicate?.photoId,
        moderationFlag: duplicate ? "LIKELY_DUPLICATE" : moderationFlag,
      },
    });
  } catch (error) {
    console.error("[seller/upload] duplicate-hash check failed, photo saved unchecked", { photoId: photo.id, error });
  }

  try {
    await recordDailyActivity(user.id);
  } catch (error) {
    console.error("[seller/upload] activity logging failed", { photoId: photo.id, error });
  }

  revalidatePath("/seller/dashboard/uploads");
  return { success: true, photoId: photo.id, score: scoreResult };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
