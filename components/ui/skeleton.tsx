import { cn } from "@/lib/utils";

/** Loading placeholder. Uses the `shimmer` keyframe (tailwind.config.ts)
 *  over a gradient rather than a flat pulse — reads as "actively loading"
 *  rather than "broken/disabled", important across every list/grid in the
 *  app (marketplace grid, dashboards, profile) per the spec's requirement
 *  for loading skeletons everywhere. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-secondary",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-background/40 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
