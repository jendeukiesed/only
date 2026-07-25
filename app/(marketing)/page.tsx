import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "PawDrop — Unlock adorable dog photos" };

// Placeholder landing hero, now wrapped by the Stage 5 (marketing)/layout.tsx
// (SiteHeader/SiteFooter) and built on Stage 4's design system. The full
// premium hero (animated background, live stats, featured creators,
// trending uploads, leaderboard, testimonials, FAQ, roadmap) needs real
// data — trending uploads and featured creators don't exist until the
// marketplace and seller modules do — so it's assembled properly once
// Stages 6-8 land. This stub only exists so "/" renders a coherent,
// on-brand page in the meantime.
export default function LandingPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-tight">🐾 PawDrop</h1>
      <p className="max-w-md text-muted-foreground">
        A marketplace for adorable dog photos. Collect mystery unlocks with points — no
        real-money payments.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="brand" size="lg">
          <Link href="/buyer/login">Sign in as buyer</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/seller/login">Sign in as creator</Link>
        </Button>
      </div>
    </main>
  );
}
