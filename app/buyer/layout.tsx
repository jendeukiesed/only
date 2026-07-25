import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Store,
  Image as ImageIcon,
  Heart,
  Trophy,
  Bell,
  History,
  Settings,
  Gift,
  Medal,
} from "lucide-react";
import { Role } from "@prisma/client";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { DashboardSidebar, type SidebarNavItem } from "@/components/layout/sidebar/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/header/dashboard-header";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/buyer/dashboard/collection", label: "Collection", icon: ImageIcon },
  { href: "/buyer/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/buyer/dashboard/achievements", label: "Achievements", icon: Trophy },
  { href: "/buyer/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/contests", label: "Contests", icon: Medal },
  { href: "/buyer/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/buyer/dashboard/history", label: "History", icon: History },
  { href: "/buyer/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function BuyerLayout({ children }: { children: ReactNode }) {
  const sessionUser = await requireBuyer();

  // pointsBalance changes on every unlock — read fresh here rather than
  // trust the (up to 30-day-lived) JWT, per the Stage 3 note in the README.
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, username: true, email: true, image: true, pointsBalance: true },
  });
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={NAV_ITEMS} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader user={user} role={Role.BUYER} pointsBalance={user.pointsBalance} />
        <main className="flex-1 bg-secondary/20 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
