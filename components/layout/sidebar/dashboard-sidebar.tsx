import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "@/components/layout/navigation/nav-link";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface DashboardSidebarProps {
  items: SidebarNavItem[];
  brandHref?: string;
}

/** Shared shell for the buyer/seller/admin dashboard sidebars — each
 *  layout.tsx passes its own `items` array (Stage 6/7/11 wire up real
 *  unread-notification/pending-report badge counts) so the three role
 *  areas share one visual/structural implementation. */
export function DashboardSidebar({ items, brandHref = "/" }: DashboardSidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href={brandHref} className="font-display text-lg font-semibold tracking-tight">
          🐾 PawDrop
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} badge={item.badge} />
        ))}
      </nav>
    </aside>
  );
}
