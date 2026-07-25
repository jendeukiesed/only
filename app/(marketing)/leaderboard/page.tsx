import Link from "next/link";
import { Role } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatPoints } from "@/utils/format";
import { currentSeasonKey, seasonLabel } from "@/lib/constants/season";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const season = currentSeasonKey();

  const [topBuyers, topSellers, topThisSeason] = await Promise.all([
    db.user.findMany({
      where: { roles: { has: Role.BUYER }, status: "ACTIVE" },
      orderBy: { xp: "desc" },
      take: 20,
      select: { id: true, username: true, name: true, image: true, xp: true, level: true },
    }),
    db.user.findMany({
      where: { roles: { has: Role.SELLER }, status: "ACTIVE" },
      orderBy: { reputationScore: "desc" },
      take: 20,
      select: { id: true, username: true, name: true, image: true, reputationScore: true, pointsBalance: true },
    }),
    // Seasonal rankings reset every calendar month (see SeasonScore /
    // services/gamification/season.ts) — no explicit "close the season"
    // job needed, since a new month simply has no rows yet.
    db.seasonScore.findMany({
      where: { season },
      orderBy: { xpEarned: "desc" },
      take: 20,
      include: { user: { select: { id: true, username: true, name: true, image: true } } },
    }),
  ]);

  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Top collectors and creators on PawDrop.</p>
      </div>

      <Tabs defaultValue="season">
        <TabsList>
          <TabsTrigger value="season">{seasonLabel(season)}</TabsTrigger>
          <TabsTrigger value="buyers">All-time collectors</TabsTrigger>
          <TabsTrigger value="sellers">Top creators</TabsTrigger>
        </TabsList>

        <TabsContent value="season">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {topThisSeason.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No unlocks yet this month — be the first on the board.
                </p>
              ) : (
                topThisSeason.map((s, i) => (
                  <Row key={s.id} rank={i + 1} username={s.user.username} name={s.user.name} image={s.user.image}>
                    <Badge variant="secondary">{s.unlocksCount} unlocks</Badge>
                    <span className="text-sm font-medium tabular-nums">{formatPoints(s.xpEarned)} XP</span>
                  </Row>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {topBuyers.map((u, i) => (
                <Row key={u.id} rank={i + 1} username={u.username} name={u.name} image={u.image}>
                  <Badge variant="secondary">Lvl {u.level}</Badge>
                  <span className="text-sm font-medium tabular-nums">{formatPoints(u.xp)} XP</span>
                </Row>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {topSellers.map((u, i) => (
                <Row key={u.id} rank={i + 1} username={u.username} name={u.name} image={u.image}>
                  <span className="text-sm font-medium tabular-nums">★ {u.reputationScore.toFixed(1)}</span>
                </Row>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  rank,
  username,
  name,
  image,
  children,
}: {
  rank: number;
  username: string;
  name: string | null;
  image: string | null;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/profile/${username}`} className="flex items-center justify-between p-4 hover:bg-secondary/40">
      <div className="flex items-center gap-3">
        <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{rank}</span>
        <Avatar className="size-9">
          <AvatarImage src={image ?? undefined} />
          <AvatarFallback>{(name ?? username).slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{name ?? username}</p>
          <p className="text-xs text-muted-foreground">@{username}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </Link>
  );
}
