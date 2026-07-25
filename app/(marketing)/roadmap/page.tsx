import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "What's live on PawDrop today and what's coming next.",
};

const SECTIONS: {
  label: string;
  tone: "default" | "secondary" | "outline";
  items: { title: string; body: string }[];
}[] = [
  {
    label: "Live now",
    tone: "default",
    items: [
      { title: "Mystery unlocks & bundles", body: "Spend points to reveal photos one at a time, or grab curated bundles at a discount." },
      { title: "AI photo scoring & moderation", body: "Every upload is scored for cuteness and quality, verified as a real dog photo, and checked for duplicates." },
      { title: "Gamification", body: "Daily streaks, XP levels, achievements, weekly and monthly missions, and a seasonal leaderboard that resets every month." },
      { title: "Photo contests", body: "Community-voted weekly and monthly contests with point prizes for the top three real dog photos." },
      { title: "Referrals & rewards", body: "Invite friends for point bonuses and spend earnings in the rewards catalog — badges, featured boosts, commission discounts." },
      { title: "Web push & PWA", body: "Install PawDrop on your phone and get notified the moment a wishlist match or contest result lands." },
    ],
  },
  {
    label: "In progress",
    tone: "secondary",
    items: [
      { title: "Collections & albums", body: "Organize your unlocked photos into shareable themed albums." },
      { title: "Creator analytics v2", body: "Deeper insight into which photos convert views into unlocks." },
      { title: "Trading", body: "Swap duplicate unlocks with other collectors — no points required." },
    ],
  },
  {
    label: "Exploring",
    tone: "outline",
    items: [
      { title: "Breed-based discovery", body: "Follow specific breeds and get a personalized feed." },
      { title: "Video moments", body: "Short clips alongside photos — same mystery unlock mechanic." },
      { title: "Community packs", body: "Collector-curated bundles where the curator earns a small share." },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="container max-w-4xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Roadmap</h1>
      <p className="mt-3 text-muted-foreground">
        What's live on PawDrop today, what we're building, and what we're dreaming about.
        Have an idea? We'd love to hear it.
      </p>

      <div className="mt-12 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.label}>
            <Badge variant={section.tone}>{section.label}</Badge>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Card key={item.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
