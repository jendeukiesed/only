import type { ReactNode } from "react";
import { LayoutDashboard, Upload, BarChart3, Users, Wallet, Settings, Gift, Medal } from "lucide-react";
import { Role } from "@prisma/client";
import { requireSeller } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { DashboardSidebar, type SidebarNavItem } from "@/components/layout/sidebar/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/header/dashboard-header";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/dashboard/uploads", label: "Uploads", icon: Upload },
  { href: "/seller/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/seller/dashboard/followers", label: "Followers", icon: Users },
  { href: "/seller/dashboard/earnings", label: "Earnings", icon: Wallet },
  { href: "/seller/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/contests", label: "Contests", icon: Medal },
  { href: "/seller/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const sessionUser = await requireSeller();

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, username: true, email: true, image: true, pointsBalance: true },
  });
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={NAV_ITEMS} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader user={user} role={Role.SELLER} pointsBalance={user.pointsBalance} />
        <main className="flex-1 bg-secondary/20 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
