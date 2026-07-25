import { cn } from "@/lib/utils";
import { formatPoints } from "@/utils/format";

/** Small inline "chip" showing a points amount with the paw-print glyph,
 *  used in headers, cards, transaction rows — anywhere a point value needs
 *  to read as currency-like without implying real money. */
export function PointsDisplay({
  amount,
  size = "default",
  signed = false,
  className,
}: {
  amount: number;
  size?: "sm" | "default" | "lg";
  signed?: boolean;
  className?: string;
}) {
  const sign = signed && amount > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold tabular-nums",
        size === "sm" && "text-xs",
        size === "default" && "text-sm",
        size === "lg" && "text-lg",
        signed && amount > 0 && "text-success",
        signed && amount < 0 && "text-destructive",
        className,
      )}
    >
      <span aria-hidden>🐾</span>
      {sign}
      {formatPoints(amount)}
    </span>
  );
}
