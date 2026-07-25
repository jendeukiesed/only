import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoteButton } from "@/features/contests/components/vote-button";
import { SubmitEntryForm } from "@/features/contests/components/submit-entry-form";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { formatDate, titleCaseEnum } from "@/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Contest" };

export default async function ContestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const contest = await db.contest.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { voteCount: "desc" },
        include: {
          photo: { select: { id: true, url: true, title: true } },
          seller: { select: { id: true, username: true, name: true, image: true } },
        },
      },
    },
  });
  if (!contest) notFound();

  const myVote = currentUser
    ? await db.contestVote.findUnique({ where: { contestId_voterId: { contestId: contest.id, voterId: currentUser.id } } })
    : null;

  const myEntry = currentUser ? contest.entries.find((e) => e.sellerId === currentUser.id) : undefined;

  let eligiblePhotos: Array<{ id: string; title: string }> = [];
  if (
    currentUser &&
    currentUser.roles.includes(Role.SELLER) &&
    !myEntry &&
    (contest.status === "ACTIVE" || contest.status === "UPCOMING")
  ) {
    eligiblePhotos = await db.photo.findMany({
      where: { sellerId: currentUser.id, status: "APPROVED" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  return (
    <div className="container space-y-6 py-10">
      <div>
        <Badge variant={contest.status === "ACTIVE" ? "success" : contest.status === "UPCOMING" ? "warning" : "secondary"}>
          {titleCaseEnum(contest.status)}
        </Badge>
        <h1 className="mt-2 font-display text-2xl font-semibold">{contest.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{contest.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(contest.startsAt)} – {formatDate(contest.endsAt)} · Prizes: {contest.firstPrizePoints} / {contest.secondPrizePoints} / {contest.thirdPrizePoints} pts
        </p>
      </div>

      {eligiblePhotos.length > 0 && <SubmitEntryForm contestId={contest.id} eligiblePhotos={eligiblePhotos} />}

      {contest.entries.length === 0 ? (
        <EmptyState icon={Trophy} title="No entries yet" description="Be the first creator to enter this contest." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {contest.entries.map((entry, i) => (
            <div key={entry.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-premium">
              <div className="relative aspect-square w-full bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.photo.url} alt={entry.photo.title} className="size-full object-cover" />
                {entry.rank && (
                  <div className="absolute left-2 top-2">
                    <Badge variant="brand">#{entry.rank}</Badge>
                  </div>
                )}
                {contest.status !== "COMPLETED" && i === 0 && entry.voteCount > 0 && (
                  <div className="absolute left-2 top-2">
                    <Badge variant="brand">Leading</Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <Link href={`/profile/${entry.seller.username}`} className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarImage src={entry.seller.image ?? undefined} />
                    <AvatarFallback className="text-[9px]">{entry.seller.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">@{entry.seller.username}</span>
                </Link>
                <p className="text-xs font-medium">{entry.voteCount} vote{entry.voteCount === 1 ? "" : "s"}</p>
                {contest.status === "ACTIVE" && currentUser && (
                  <VoteButton entryId={entry.id} disabled={!!myVote || entry.sellerId === currentUser.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
