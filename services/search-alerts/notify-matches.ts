import "server-only";
import { db } from "@/lib/db/prisma";
import { createNotification } from "@/services/notifications/create";
import type { AgeCategory, EnergyLevel, Prisma } from "@prisma/client";

interface ApprovedPhotoForMatching {
  id: string;
  title: string;
  breed: string | null;
  ageCategory: AgeCategory | null;
  energyLevel: EnergyLevel | null;
  color: string | null;
  price: number;
}

/**
 * Called once, right after a photo is approved (see
 * actions/admin/moderation.ts) — distinct from Wishlist (which saves one
 * specific photo a buyer already found): a SavedSearchAlert is a standing
 * filter a buyer sets once, and this is what actually fires when a new
 * photo matches it, so they don't have to keep re-checking the
 * marketplace manually.
 *
 * A field left blank on the alert (e.g. no breed specified) matches any
 * value for that field — only the fields the buyer actually set narrow
 * the match.
 */
export async function notifyMatchingSavedSearches(photo: ApprovedPhotoForMatching) {
  // Built field-by-field rather than as one literal object so the
  // null-handling is exact: an alert field left blank means "any value
  // matches," but an alert field that's *set* only matches a photo that
  // actually has a value for that field too — a photo with no breed set
  // should never satisfy a "Corgi only" alert just because Prisma treats
  // an `undefined` filter value as "no constraint."
  const breedCondition: Prisma.SavedSearchAlertWhereInput =
    photo.breed === null ? { breed: null } : { OR: [{ breed: null }, { breed: photo.breed }] };
  const ageCondition: Prisma.SavedSearchAlertWhereInput =
    photo.ageCategory === null ? { ageCategory: null } : { OR: [{ ageCategory: null }, { ageCategory: photo.ageCategory }] };
  const energyCondition: Prisma.SavedSearchAlertWhereInput =
    photo.energyLevel === null ? { energyLevel: null } : { OR: [{ energyLevel: null }, { energyLevel: photo.energyLevel }] };
  const colorCondition: Prisma.SavedSearchAlertWhereInput =
    photo.color === null ? { color: null } : { OR: [{ color: null }, { color: photo.color }] };
  const priceCondition: Prisma.SavedSearchAlertWhereInput = { OR: [{ maxPrice: null }, { maxPrice: { gte: photo.price } }] };

  const candidates = await db.savedSearchAlert.findMany({
    where: {
      isActive: true,
      AND: [breedCondition, ageCondition, energyCondition, colorCondition, priceCondition],
    },
    select: { id: true, userId: true },
  });

  if (candidates.length === 0) return;

  // A buyer might have several overlapping alerts (e.g. "any Corgi" and
  // "any puppy") that both match the same photo — notify them once, not
  // once per matching alert.
  const uniqueUserIds = [...new Set(candidates.map((c) => c.userId))];

  await Promise.all(
    uniqueUserIds.map((userId) =>
      createNotification({
        userId,
        type: "SAVED_SEARCH_MATCH",
        title: "A new photo matches your alert",
        body: `"${photo.title}" just went live and matches one of your saved searches.`,
        link: `/mystery/${photo.id}`,
      }),
    ),
  );

  await db.savedSearchAlert.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: { lastMatchedAt: new Date() },
  });
}
