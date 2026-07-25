import Link from "next/link";
import { Bell } from "lucide-react";
import type { Role } from "@prisma/client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { PointsDisplay } from "@/components/shared/points-display";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  user: {
    name: string | null;
    username: string;
    email: string;
    image?: string | null;
  };
  role: Role;
  pointsBalance?: number;
  unreadNotifications?: number;
}

/** Sticky top bar for the three authenticated dashboard shells. Shows the
 *  live points balance only for buyers/sellers (admins don't hold a
 *  spendable balance) — pulled fresh from the DB by each layout.tsx rather
 *  than trusted from the JWT, since balances change every unlock. */
export function DashboardHeader({ user, role, pointsBalance, unreadNotifications = 0 }: DashboardHeaderProps) {
  return (
    <header className="glass glass-border sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 lg:px-6">
      <div className="lg:hidden">
        <Link href="/" className="font-display text-lg font-semibold">
          🐾 PawDrop
        </Link>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        {pointsBalance !== undefined && (
          <div
            data-testid="points-balance"
            className="hidden rounded-full border border-border bg-secondary px-3 py-1.5 sm:flex"
          >
            <PointsDisplay amount={pointsBalance} />
          </div>
        )}
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href={`/${role.toLowerCase()}/dashboard/notifications`} aria-label="Notifications">
            <Bell className="size-5" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-brand" />
            )}
          </Link>
        </Button>
        <ThemeToggle />
        <UserMenu
          name={user.name ?? user.username}
          username={user.username}
          email={user.email}
          image={user.image}
          role={role}
        />
      </div>
    </header>
  );
}
