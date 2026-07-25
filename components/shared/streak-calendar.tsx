import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  days: Array<{ date: Date; active: boolean }>;
  currentStreak: number;
  longestStreak: number;
}

/** A GitHub-contributions-style strip of the last N days (see
 *  services/gamification/activity.ts for how `days` is computed from
 *  ActivityLog rows) — makes the otherwise-invisible daily streak feel
 *  like real progress instead of just a number in a stat card. */
export function StreakCalendar({ days, currentStreak, longestStreak }: StreakCalendarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className={cn("size-5", currentStreak > 0 ? "text-brand" : "text-muted-foreground")} />
          <div>
            <p className="font-display text-sm font-semibold">{currentStreak}-day streak</p>
            <p className="text-xs text-muted-foreground">Longest: {longestStreak} days</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="img" aria-label={`Activity over the last ${days.length} days`}>
        {days.map(({ date, active }) => (
          <div
            key={date.toISOString()}
            title={`${date.toLocaleDateString()}${active ? " — active" : ""}`}
            className={cn(
              "size-3.5 rounded-sm transition-colors",
              active ? "bg-brand" : "bg-secondary",
            )}
          />
        ))}
      </div>
    </div>
  );
}
