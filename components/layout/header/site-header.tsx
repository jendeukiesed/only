import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/contests", label: "Contests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/faq", label: "FAQ" },
  { href: "/roadmap", label: "Roadmap" },
];

/** Public marketing header — landing, FAQ, roadmap, leaderboard, and the
 *  logged-out side of the marketplace all share this. Authenticated
 *  dashboards use DashboardHeader instead. */
export function SiteHeader() {
  return (
    <header className="glass glass-border sticky top-0 z-40 border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          🐾 PawDrop
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/buyer/login">Sign in</Link>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link href="/buyer/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
