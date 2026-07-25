import { Trophy } from "lucide-react";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const user = await requireBuyer();

  const [achievements, unlocked] = await Promise.all([
    db.achievement.findMany({ orderBy: { xpReward: "asc" } }),
    db.userAchievement.findMany({ where: { userId: user.id } }),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Achievements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unlocked.length} of {achievements.length} unlocked.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {achievements.map((achievement) => {
          const unlockedAt = unlockedMap.get(achievement.id);
          const isUnlocked = Boolean(unlockedAt);
          return (
            <Card key={achievement.id} className={cn(!isUnlocked && "opacity-60")}>
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl",
                    isUnlocked ? "bg-brand/15" : "bg-secondary grayscale",
                  )}
                >
                  {achievement.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{achievement.name}</h3>
                    {isUnlocked && (
                      <Badge variant="success" className="shrink-0">
                        <Trophy className="size-3" /> Unlocked
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{achievement.description}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    +{achievement.xpReward} XP · +{achievement.pointsReward} pts
                    {unlockedAt && ` · Earned ${formatDate(unlockedAt)}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
