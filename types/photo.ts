import type { AgeCategory, EnergyLevel, ModerationFlag, ScoreTier, UploadStatus } from "@prisma/client";

/**
 * The shape every photo-rendering surface (marketplace grid, buyer
 * collection, seller upload list, wishlist, search results) needs — a
 * deliberately narrow projection of the `Photo` + `PhotoScore` + `seller`
 * Prisma models, not the full row. Server Actions/queries in Stages 6-8
 * select down to this shape (via Prisma `select`) rather than passing
 * whole ORM records into Client Components.
 */
export interface PhotoCardData {
  id: string;
  title: string;
  blurredUrl: string;
  url: string;
  price: number;
  overallScore: number | null;
  scoreTier: ScoreTier | null;
  breed: string | null;
  ageCategory: AgeCategory | null;
  energyLevel: EnergyLevel | null;
  color: string | null;
  likeCount: number;
  commentCount: number;
  unlockCount: number;
  status: UploadStatus;
  rejectionReason?: string | null;
  moderationFlag: ModerationFlag;
  createdAt: string; // serialized Date — Server -> Client Component boundary
  tags: string[];
  seller: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    reputationScore: number;
  };
}
