import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { ScoreTierBadge } from "@/components/shared/score-tier-badge";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/features/social/components/like-button";
import { BookmarkButton } from "@/features/social/components/bookmark-button";
import { CommentSection } from "@/features/social/components/comment-section";
import { titleCaseEnum } from "@/utils/format";
import type { CommentData } from "@/types/comment";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPhotoPage({ params }: PageProps) {
  const user = await requireBuyer();
  const { id } = await params;

  const [unlock, photo, like, bookmark, comments] = await Promise.all([
    db.mysteryUnlock.findFirst({ where: { buyerId: user.id, photoId: id } }),
    db.photo.findUnique({
      where: { id },
      include: { seller: { select: { id: true, username: true, reputationScore: true } } },
    }),
    db.like.findUnique({ where: { userId_photoId: { userId: user.id, photoId: id } } }),
    db.bookmark.findUnique({ where: { userId_photoId: { userId: user.id, photoId: id } } }),
    db.comment.findMany({
      where: { photoId: id, parentId: null, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, username: true, name: true, image: true } } },
        },
      },
    }),
  ]);

  if (!unlock || !photo) notFound();

  const commentData: CommentData[] = comments.map((c) => ({
    id: c.id,
    body: c.body,
    isPinned: c.isPinned,
    createdAt: c.createdAt.toISOString(),
    user: c.user,
    replies: c.replies.map((r) => ({
      id: r.id,
      body: r.body,
      isPinned: r.isPinned,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
      replies: [],
    })),
  }));

  const canPin = photo.seller.id === user.id || user.roles.includes(Role.ADMIN);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.title} className="w-full object-cover" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold">{photo.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            by @{photo.seller.username} · reputation {photo.seller.reputationScore.toFixed(1)}
          </p>
        </div>
        <div className="flex gap-2">
          <LikeButton photoId={photo.id} initialLiked={Boolean(like)} initialCount={photo.likeCount} />
          <BookmarkButton photoId={photo.id} initialBookmarked={Boolean(bookmark)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {photo.scoreTier && <ScoreTierBadge tier={photo.scoreTier} />}
        {photo.breed && <Badge variant="outline">{photo.breed}</Badge>}
        {photo.energyLevel && <Badge variant="outline">{titleCaseEnum(photo.energyLevel)}</Badge>}
      </div>

      {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}

      <div className="border-t border-border pt-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Comments ({photo.commentCount})</h2>
        <CommentSection photoId={photo.id} initialComments={commentData} canPin={canPin} />
      </div>
    </div>
  );
}
