import { Users } from "lucide-react";
import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { formatRelativeTime } from "@/utils/format";

export const metadata = { title: "Followers" };

export default async function FollowersPage() {
  const user = await requireSeller();

  const followers = await db.follow.findMany({
    where: { followingId: user.id },
    orderBy: { createdAt: "desc" },
    include: { follower: { select: { id: true, username: true, name: true, image: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Followers</h1>
        <p className="mt-1 text-sm text-muted-foreground">{followers.length} people follow you.</p>
      </div>

      {followers.length === 0 ? (
        <EmptyState icon={Users} title="No followers yet" description="Followers show up here as buyers discover your uploads." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {followers.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={f.follower.image ?? undefined} alt={f.follower.username} />
                    <AvatarFallback>{(f.follower.name ?? f.follower.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{f.follower.name ?? f.follower.username}</p>
                    <p className="text-xs text-muted-foreground">@{f.follower.username}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Since {formatRelativeTime(f.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
