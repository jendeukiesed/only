"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AgeCategory, EnergyLevel } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { titleCaseEnum } from "@/utils/format";

const FILTER_KEYS = ["breed", "ageCategory", "energyLevel", "color", "minPrice", "maxPrice"];

/** All filter state lives in the URL (searchParams), not component state
 *  or Zustand — filters stay shareable/bookmarkable and survive a back
 *  button press, which matters more for a browse-heavy marketplace than
 *  centralized client state would. */
export function FiltersSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => params.delete(k));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const hasActiveFilters = FILTER_KEYS.some((k) => searchParams.get(k));

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Breed</Label>
        <Input
          defaultValue={searchParams.get("breed") ?? ""}
          onBlur={(e) => setParam("breed", e.target.value)}
          placeholder="e.g. Corgi"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Age</Label>
        <Select defaultValue={searchParams.get("ageCategory") ?? ""} onValueChange={(v) => setParam("ageCategory", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(AgeCategory).map((v) => (
              <SelectItem key={v} value={v}>
                {titleCaseEnum(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Energy level</Label>
        <Select defaultValue={searchParams.get("energyLevel") ?? ""} onValueChange={(v) => setParam("energyLevel", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(EnergyLevel).map((v) => (
              <SelectItem key={v} value={v}>
                {titleCaseEnum(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <Input
          defaultValue={searchParams.get("color") ?? ""}
          onBlur={(e) => setParam("color", e.target.value)}
          placeholder="e.g. Cream"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Price range (points)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => setParam("minPrice", e.target.value)}
            placeholder="Min"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => setParam("maxPrice", e.target.value)}
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );
}
