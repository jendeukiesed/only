import Link from "next/link";
import { Wallet, Flame, Trophy, Users } from "lucide-react";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { StatCard } from "@/components/shared/cards/stat-card";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { StreakCalendar } from "@/components/shared/streak-calendar";
import { ReferralWidget } from "@/features/referrals/components/referral-widget";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { formatPoints, formatRelativeTime } from "@/utils/format";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";
import { getActivityCalendar } from "@/services/gamification/activity";

export const metadata = { title: "Buyer dashboard" };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function BuyerDashboardPage() {
  const sessionUser = await requireBuyer();

  const [user, recentUnlocks, achievementCount, totalAchievements, followingCount, activityDays, referralCount] =
    await Promise.all([
      db.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          name: true,
          username: true,
          pointsBalance: true,
          xp: true,
          level: true,
          streakCount: true,
          longestStreak: true,
          referralCode: true,
        },
      }),
      db.mysteryUnlock.findMany({
        where: { buyerId: sessionUser.id },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { photo: { select: photoCardSelect } },
      }),
      db.userAchievement.count({ where: { userId: sessionUser.id } }),
      db.achievement.count(),
      db.follow.count({ where: { followerId: sessionUser.id } }),
      getActivityCalendar(sessionUser.id, 30),
      db.user.count({ where: { referredById: sessionUser.id } }),
    ]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Welcome back, {user.name?.split(" ")[0] ?? user.username} 🐾</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your collection.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Points balance" value={formatPoints(user.pointsBalance)} icon={Wallet} />
        <StatCard label="Day streak" value={String(user.streakCount)} icon={Flame} />
        <StatCard label="Achievements" value={`${achievementCount}/${totalAchievements}`} icon={Trophy} />
        <StatCard label="Following" value={String(followingCount)} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StreakCalendar days={activityDays} currentStreak={user.streakCount} longestStreak={user.longestStreak} />
        <ReferralWidget referralUrl={`${APP_URL}/buyer/register?ref=${user.referralCode}`} referralCount={referralCount} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent unlocks</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/buyer/dashboard/collection">View collection</Link>
          </Button>
        </div>

        {recentUnlocks.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No unlocks yet"
            description="Head to the marketplace and unlock your first mystery photo."
            action={{ label: "Browse marketplace", href: "/marketplace" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentUnlocks.map((unlock) => (
              <div key={unlock.id} className="space-y-1.5">
                <PhotoCard photo={toPhotoCardData(unlock.photo)} variant="unlocked" />
                <p className="px-1 text-xs text-muted-foreground">
                  Unlocked {formatRelativeTime(unlock.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
