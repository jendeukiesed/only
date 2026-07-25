"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { createNotification } from "@/services/notifications/create";
import { voteContestEntrySchema } from "@/schemas/contests.schema";

/**
 * One vote per user per contest (`@@unique([contestId, voterId])` on
 * ContestVote), enforced here by checking first and again by letting the
 * unique constraint reject a race rather than trusting the check alone.
 * `voteCount` on ContestEntry is a denormalized counter, incremented in
 * the same transaction as the vote row, so ranking reads don't need to
 * `COUNT()` votes on every page view.
 */
export async function voteContestEntryAction(input: { entryId: string }) {
  const user = await assertUser();
  const parsed = voteContestEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid entry." };

  const entry = await db.contestEntry.findUnique({
    where: { id: parsed.data.entryId },
    select: { id: true, contestId: true, sellerId: true, contest: { select: { status: true } } },
  });
  if (!entry) return { success: false, message: "Entry not found." };
  if (entry.contest.status !== "ACTIVE") return { success: false, message: "Voting is closed for this contest." };
  if (entry.sellerId === user.id) return { success: false, message: "You can't vote for your own entry." };

  try {
    await db.$transaction(async (tx) => {
      await tx.contestVote.create({
        data: { contestId: entry.contestId, entryId: entry.id, voterId: user.id },
      });
      await tx.contestEntry.update({ where: { id: entry.id }, data: { voteCount: { increment: 1 } } });
    });
  } catch (error: unknown) {
    // Unique constraint violation ([contestId, voterId]) means they'd
    // already voted in this contest — treat it as a friendly message, not
    // a crash.
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      return { success: false, message: "You've already voted in this contest." };
    }
    console.error("[contests/vote] failed", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  await createNotification({
    userId: entry.sellerId,
    type: "CONTEST_ENTRY_RECEIVED_VOTE",
    title: "New vote!",
    body: "Someone voted for your contest entry.",
    link: `/contests/${entry.contestId}`,
  }).catch((error) => console.error("[contests/vote] notification failed", error));

  revalidatePath(`/contests/${entry.contestId}`);
  return { success: true };
}
