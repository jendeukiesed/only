import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Flag,
  FolderTree,
  FileText,
  BarChart3,
  Wallet,
  Megaphone,
  Star,
  Settings,
  Medal,
  Package,
} from "lucide-react";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/rbac";
import { DashboardSidebar, type SidebarNavItem } from "@/components/layout/sidebar/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/header/dashboard-header";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/users", label: "Users", icon: Users },
  { href: "/admin/dashboard/moderation", label: "Moderation", icon: ShieldAlert },
  { href: "/admin/dashboard/reports", label: "Reports", icon: Flag },
  { href: "/admin/dashboard/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/dashboard/economy", label: "Point economy", icon: Wallet },
  { href: "/admin/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/dashboard/featured", label: "Featured", icon: Star },
  { href: "/admin/dashboard/contests", label: "Contests", icon: Medal },
  { href: "/admin/dashboard/bundles", label: "Bundles", icon: Package },
  { href: "/admin/dashboard/logs", label: "Logs", icon: FileText },
  { href: "/admin/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={NAV_ITEMS} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          user={{ name: user.name, username: user.username, email: user.email!, image: user.image }}
          role={Role.ADMIN}
        />
        <main className="flex-1 bg-secondary/20 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
