"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellPlus, BellOff, Bell, Trash2 } from "lucide-react";
import { AgeCategory, EnergyLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  createSavedSearchAlertAction,
  deleteSavedSearchAlertAction,
  toggleSavedSearchAlertAction,
} from "@/actions/buyer/saved-search-alerts";
import { titleCaseEnum } from "@/utils/format";

interface SavedAlert {
  id: string;
  breed: string | null;
  ageCategory: AgeCategory | null;
  energyLevel: EnergyLevel | null;
  color: string | null;
  maxPrice: number | null;
  isActive: boolean;
}

const ANY = "any";

/** Lets a buyer set a standing filter (breed/age/energy/color/max price)
 *  once instead of re-browsing the marketplace to check for new matches —
 *  the actual matching happens server-side the moment a photo is approved
 *  (see services/search-alerts/notify-matches.ts), this panel is just the
 *  CRUD surface for the alerts themselves. */
export function SavedSearchAlertsPanel({ alerts }: { alerts: SavedAlert[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [breed, setBreed] = useState("");
  const [ageCategory, setAgeCategory] = useState<string>(ANY);
  const [energyLevel, setEnergyLevel] = useState<string>(ANY);
  const [color, setColor] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function handleCreate() {
    startTransition(async () => {
      const result = await createSavedSearchAlertAction({
        breed: breed || undefined,
        ageCategory: ageCategory === ANY ? undefined : (ageCategory as AgeCategory),
        energyLevel: energyLevel === ANY ? undefined : (energyLevel as EnergyLevel),
        color: color || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't create the alert.");
        return;
      }
      toast.success("Alert created — we'll notify you when a match goes live.");
      setBreed("");
      setAgeCategory(ANY);
      setEnergyLevel(ANY);
      setColor("");
      setMaxPrice("");
      router.refresh();
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleSavedSearchAlertAction(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSavedSearchAlertAction(id);
      toast.success("Alert removed.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
      <div className="mb-4 flex items-center gap-2">
        <BellPlus className="size-5 text-brand" />
        <div>
          <p className="font-display text-sm font-semibold">Match alerts</p>
          <p className="text-xs text-muted-foreground">Get notified when a new photo matches your criteria.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Input placeholder="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
        <Select value={ageCategory} onValueChange={setAgeCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Age" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any age</SelectItem>
            {Object.values(AgeCategory).map((v) => (
              <SelectItem key={v} value={v}>{titleCaseEnum(v)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={energyLevel} onValueChange={setEnergyLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Energy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any energy</SelectItem>
            {Object.values(EnergyLevel).map((v) => (
              <SelectItem key={v} value={v}>{titleCaseEnum(v)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
        <Input
          type="number"
          min={1}
          max={500}
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
      <Button variant="brand" size="sm" className="mt-3" onClick={handleCreate} disabled={isPending}>
        Create alert
      </Button>

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/40 p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {alert.breed && <Badge variant="outline">{alert.breed}</Badge>}
                {alert.ageCategory && <Badge variant="outline">{titleCaseEnum(alert.ageCategory)}</Badge>}
                {alert.energyLevel && <Badge variant="outline">{titleCaseEnum(alert.energyLevel)}</Badge>}
                {alert.color && <Badge variant="outline">{alert.color}</Badge>}
                {alert.maxPrice && <Badge variant="outline">≤ {alert.maxPrice} pts</Badge>}
                {!alert.isActive && <Badge variant="secondary">Paused</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleToggle(alert.id)} disabled={isPending} aria-label="Toggle alert">
                  {alert.isActive ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)} disabled={isPending} aria-label="Delete alert">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
