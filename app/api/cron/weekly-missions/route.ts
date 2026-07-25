import { NextResponse } from "next/server";
import { endOfWeek, startOfWeek } from "date-fns";
import { MissionPeriod } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { verifyCronRequest } from "@/lib/cron/verify-cron-request";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled once a week (see .github/workflows/cron.yml / vercel.json —
 * Mondays at 00:05 UTC, just after the daily-streak job's window). Mission
 * rows are long-lived and keyed by a stable `key` (see
 * db/prisma/seed/seed.ts's `missionDefs`) rather than being recreated every
 * week, so this job's job is to roll each WEEKLY mission's `startsAt`/
 * `endsAt` window forward and clear last week's progress — otherwise a
 * mission a buyer completed last Tuesday would show as permanently
 * "completed" forever instead of resetting for the new week.
 */
const WEEKLY_MISSION_TEMPLATES = [
  {
    key: "weekly_unlock_5",
    name: "Weekly Explorer",
    description: "Unlock 5 photos this week",
    xpReward: 100,
    pointsReward: 20,
    targetCount: 5,
    criteria: { type: "unlock" },
  },
  {
    key: "weekly_upload_3",
    name: "Weekly Creator",
    description: "Upload 3 photos this week",
    xpReward: 100,
    pointsReward: 20,
    targetCount: 3,
    criteria: { type: "upload" },
  },
];

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  let rolled = 0;
  let progressReset = 0;

  for (const template of WEEKLY_MISSION_TEMPLATES) {
    const mission = await db.mission.upsert({
      where: { key: template.key },
      update: {
        startsAt: weekStart,
        endsAt: weekEnd,
        name: template.name,
        description: template.description,
        xpReward: template.xpReward,
        pointsReward: template.pointsReward,
        targetCount: template.targetCount,
        criteria: template.criteria,
      },
      create: {
        ...template,
        period: MissionPeriod.WEEKLY,
        startsAt: weekStart,
        endsAt: weekEnd,
      },
    });
    rolled++;

    const { count } = await db.userMission.updateMany({
      where: { missionId: mission.id },
      data: { progress: 0, isCompleted: false, completedAt: null },
    });
    progressReset += count;
  }

  return NextResponse.json({ ok: true, rolled, progressReset, weekStart, weekEnd });
}
