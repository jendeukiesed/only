import Link from "next/link";
import { Wallet, Users, Star, Clock } from "lucide-react";
import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { StatCard } from "@/components/shared/cards/stat-card";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { StreakCalendar } from "@/components/shared/streak-calendar";
import { ReferralWidget } from "@/features/referrals/components/referral-widget";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { formatPoints } from "@/utils/format";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";
import { getActivityCalendar } from "@/services/gamification/activity";

export const metadata = { title: "Seller dashboard" };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function SellerDashboardPage() {
  const sessionUser = await requireSeller();

  const [user, pendingCount, followerCount, recentUploads, activityDays, referralCount] = await Promise.all([
    db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        name: true,
        username: true,
        pointsBalance: true,
        reputationScore: true,
        streakCount: true,
        longestStreak: true,
        referralCode: true,
      },
    }),
    db.photo.count({ where: { sellerId: sessionUser.id, status: "PENDING" } }),
    db.follow.count({ where: { followingId: sessionUser.id } }),
    db.photo.findMany({
      where: { sellerId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: photoCardSelect,
    }),
    getActivityCalendar(sessionUser.id, 30),
    db.user.count({ where: { referredById: sessionUser.id } }),
  ]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Welcome back, {user.name?.split(" ")[0] ?? user.username} 🎨</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's how your uploads are performing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Points balance" value={formatPoints(user.pointsBalance)} icon={Wallet} />
        <StatCard label="Followers" value={String(followerCount)} icon={Users} />
        <StatCard label="Reputation" value={user.reputationScore.toFixed(1)} icon={Star} />
        <StatCard label="Pending review" value={String(pendingCount)} icon={Clock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StreakCalendar days={activityDays} currentStreak={user.streakCount} longestStreak={user.longestStreak} />
        <ReferralWidget referralUrl={`${APP_URL}/buyer/register?ref=${user.referralCode}`} referralCount={referralCount} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent uploads</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/dashboard/uploads">View all</Link>
          </Button>
        </div>

        {recentUploads.length === 0 ? (
          <EmptyState
            title="No uploads yet"
            description="Upload your first dog photo to get an instant AI score."
            action={{ label: "Upload a photo", href: "/seller/dashboard/uploads/new" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentUploads.map((photo) => (
              <PhotoCard key={photo.id} photo={toPhotoCardData(photo)} variant="seller" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
