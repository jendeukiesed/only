"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { submitContestEntrySchema, type SubmitContestEntryInput } from "@/schemas/contests.schema";

/**
 * A seller enters one of their own listings into a contest. Entries are
 * always an existing, already-APPROVED Photo the seller already sells in
 * the marketplace — never a separate upload — so a contest can't become a
 * side channel for unmoderated content, and a photo's contest performance
 * is inseparable from its real marketplace listing.
 */
export async function submitContestEntryAction(input: SubmitContestEntryInput) {
  const seller = await assertRole(Role.SELLER);
  const parsed = submitContestEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid entry." };

  const contest = await db.contest.findUnique({ where: { id: parsed.data.contestId } });
  if (!contest) return { success: false, message: "Contest not found." };
  if (contest.status !== "ACTIVE" && contest.status !== "UPCOMING") {
    return { success: false, message: "This contest is no longer accepting entries." };
  }

  const photo = await db.photo.findUnique({
    where: { id: parsed.data.photoId },
    select: { sellerId: true, status: true },
  });
  if (!photo || photo.sellerId !== seller.id || photo.status !== "APPROVED") {
    return { success: false, message: "You can only enter your own approved listings." };
  }

  const existingEntry = await db.contestEntry.findUnique({
    where: { contestId_sellerId: { contestId: contest.id, sellerId: seller.id } },
  });
  if (existingEntry) return { success: false, message: "You've already entered this contest." };

  await db.contestEntry.create({
    data: { contestId: contest.id, photoId: parsed.data.photoId, sellerId: seller.id },
  });

  revalidatePath(`/contests/${contest.id}`);
  return { success: true };
}
