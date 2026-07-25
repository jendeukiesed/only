import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** The one true classname merger — every component in components/ui and
 *  features/*\/components uses this instead of raw template strings, so
 *  conflicting Tailwind utilities (e.g. a consumer passing `p-8` to
 *  override a component's default `p-4`) resolve predictably. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatting helpers (points, dates, enums) live in utils/format.ts, not
// here — lib/ is reserved for infra singletons/config per the project's
// layer boundaries (see README's "Import boundary rules"); this file stays
// scoped to the shadcn-convention `cn()` helper only.
