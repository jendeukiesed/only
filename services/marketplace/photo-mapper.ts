import "server-only";
import type { Prisma } from "@prisma/client";
import type { PhotoCardData } from "@/types/photo";

/**
 * The canonical Prisma `select` for anything that will be rendered as a
 * PhotoCard (Stage 5) — buyer collection/wishlist, seller upload list,
 * marketplace grid, search results. One shape, one mapper, so every
 * surface stays in sync when the card's data needs change.
 */
export const photoCardSelect = {
  id: true,
  title: true,
  blurredUrl: true,
  url: true,
  price: true,
  overallScore: true,
  scoreTier: true,
  breed: true,
  ageCategory: true,
  energyLevel: true,
  color: true,
  likeCount: true,
  commentCount: true,
  unlockCount: true,
  status: true,
  rejectionReason: true,
  moderationFlag: true,
  createdAt: true,
  tags: { select: { tag: { select: { name: true } } } },
  seller: { select: { id: true, username: true, name: true, image: true, reputationScore: true } },
} satisfies Prisma.PhotoSelect;

type PhotoWithSelect = Prisma.PhotoGetPayload<{ select: typeof photoCardSelect }>;

export function toPhotoCardData(photo: PhotoWithSelect): PhotoCardData {
  return {
    id: photo.id,
    title: photo.title,
    blurredUrl: photo.blurredUrl,
    url: photo.url,
    price: photo.price,
    overallScore: photo.overallScore,
    scoreTier: photo.scoreTier,
    breed: photo.breed,
    ageCategory: photo.ageCategory,
    energyLevel: photo.energyLevel,
    color: photo.color,
    likeCount: photo.likeCount,
    commentCount: photo.commentCount,
    unlockCount: photo.unlockCount,
    status: photo.status,
    rejectionReason: photo.rejectionReason,
    moderationFlag: photo.moderationFlag,
    createdAt: photo.createdAt.toISOString(),
    tags: photo.tags.map((t) => t.tag.name),
    seller: photo.seller,
  };
}
