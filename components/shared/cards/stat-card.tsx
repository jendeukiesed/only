import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  className?: string;
}

/** Compact metric tile used across buyer/seller/admin dashboards (point
 *  balance, total earnings, followers, pending reports, etc). Keeping one
 *  implementation means dashboard grids line up visually no matter which
 *  role is viewing. */
export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          {trend && (
            <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label ?? "vs last month"}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
