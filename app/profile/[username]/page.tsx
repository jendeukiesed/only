import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PhotoCard } from "@/components/shared/cards/photo-card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { FollowButton } from "@/features/social/components/follow-button";
import { toPhotoCardData, photoCardSelect } from "@/services/marketplace/photo-mapper";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();

  const profile = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      image: true,
      bannerImage: true,
      roles: true,
      reputationScore: true,
      level: true,
      createdAt: true,
    },
  });
  if (!profile) notFound();

  const isSeller = profile.roles.includes(Role.SELLER);

  const [followerCount, followingCount, uploadCount, recentUploads, isFollowing] = await Promise.all([
    db.follow.count({ where: { followingId: profile.id } }),
    db.follow.count({ where: { followerId: profile.id } }),
    isSeller ? db.photo.count({ where: { sellerId: profile.id, status: "APPROVED" } }) : Promise.resolve(0),
    isSeller
      ? db.photo.findMany({
          where: { sellerId: profile.id, status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: photoCardSelect,
        })
      : Promise.resolve([]),
    session?.user && session.user.id !== profile.id
      ? db.follow.findUnique({
          where: { followerId_followingId: { followerId: session.user.id, followingId: profile.id } },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand/30 to-secondary">
        {profile.bannerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerImage} alt="" className="size-full object-cover" />
        )}
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <Avatar className="-mt-12 size-24 border-4 border-background">
            <AvatarImage src={profile.image ?? undefined} alt={profile.username} />
            <AvatarFallback className="text-2xl">{(profile.name ?? profile.username).slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold">{profile.name ?? profile.username}</h1>
              {isSeller && <Badge variant="brand">Creator</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username} · Level {profile.level}</p>
          </div>
        </div>
        {session?.user && session.user.id !== profile.id && isSeller && (
          <FollowButton sellerId={profile.id} initialFollowing={Boolean(isFollowing)} />
        )}
      </div>

      {profile.bio && <p className="max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>}

      <div className="flex flex-wrap gap-6 border-y border-border py-4 text-sm">
        <Stat label="Followers" value={followerCount} />
        <Stat label="Following" value={followingCount} />
        {isSeller && <Stat label="Uploads" value={uploadCount} />}
        {isSeller && <Stat label="Reputation" value={profile.reputationScore.toFixed(1)} />}
      </div>

      {isSeller && (
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold">Recent uploads</h2>
          {recentUploads.length === 0 ? (
            <EmptyState title="No uploads yet" description="This creator hasn't published anything yet." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentUploads.map((photo) => (
                <Link key={photo.id} href={`/mystery/${photo.id}`}>
                  <PhotoCard photo={toPhotoCardData(photo)} variant="locked" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
