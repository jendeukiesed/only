import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { verifyCronRequest } from "@/lib/cron/verify-cron-request";
import { createNotification } from "@/services/notifications/create";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Runs frequently (hourly is reasonable — see .github/workflows/cron.yml /
 * vercel.json) rather than on a fixed daily/weekly clock like the streak
 * and mission jobs, since contests can have arbitrary admin-set end times.
 * For every ACTIVE contest whose `endsAt` has passed: ranks entries by
 * `voteCount` (ties broken by earliest entry), pays the top three their
 * prize points as an immutable CONTEST_PRIZE ledger entry, and flips the
 * contest to COMPLETED so it stops accepting votes.
 */
export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const endedContests = await db.contest.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    include: { entries: { orderBy: [{ voteCount: "desc" }, { createdAt: "asc" }] } },
  });

  // Also promote any UPCOMING contest whose start time has arrived —
  // otherwise a contest created for a future date would silently never
  // open unless an admin edited it by hand.
  const { count: opened } = await db.contest.updateMany({
    where: { status: "UPCOMING", startsAt: { lte: now } },
    data: { status: "ACTIVE" },
  });

  let closed = 0;
  for (const contest of endedContests) {
    const prizes = [contest.firstPrizePoints, contest.secondPrizePoints, contest.thirdPrizePoints];

    for (let i = 0; i < Math.min(3, contest.entries.length); i++) {
      const entry = contest.entries[i]!;
      const prizePoints = prizes[i]!;
      if (prizePoints <= 0) continue;

      await db.$transaction(async (tx) => {
        const updatedSeller = await tx.user.update({
          where: { id: entry.sellerId },
          data: { pointsBalance: { increment: prizePoints } },
          select: { pointsBalance: true },
        });
        await tx.pointTransaction.create({
          data: {
            userId: entry.sellerId,
            type: "CONTEST_PRIZE",
            amount: prizePoints,
            balanceAfter: updatedSeller.pointsBalance,
            description: `Contest prize — "${contest.title}" (#${i + 1})`,
          },
        });
        await tx.contestEntry.update({ where: { id: entry.id }, data: { rank: i + 1, prizePointsAwarded: prizePoints } });
      });

      await createNotification({
        userId: entry.sellerId,
        type: "CONTEST_WON",
        title: `You placed #${i + 1} in "${contest.title}"!`,
        body: `You won ${prizePoints} points. Congratulations!`,
        link: `/contests/${contest.id}`,
      }).catch((error) => console.error("[cron/close-contests] winner notification failed", error));
    }

    await db.contest.update({ where: { id: contest.id }, data: { status: "COMPLETED" } });
    closed++;
  }

  return NextResponse.json({ ok: true, closed, opened, ranAt: now.toISOString() });
}
