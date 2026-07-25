"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingAction } from "@/actions/admin/settings";

export function EconomySettingsForm({
  initialCommission,
  initialStartingPoints,
}: {
  initialCommission: number;
  initialStartingPoints: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [commission, setCommission] = useState(String(initialCommission));
  const [startingPoints, setStartingPoints] = useState(String(initialStartingPoints));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const results = await Promise.all([
        updatePlatformSettingAction({ key: "platform_commission_percent", value: Number(commission) }),
        updatePlatformSettingAction({ key: "starting_buyer_points", value: Number(startingPoints) }),
      ]);
      if (results.every((r) => r.success)) toast.success("Settings saved.");
      else toast.error("Something went wrong.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Platform commission (%)</Label>
        <Input type="number" min={0} max={100} value={commission} onChange={(e) => setCommission(e.target.value)} />
        <p className="text-xs text-muted-foreground">Percentage of every unlock retained by the platform.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Starting points for new buyers</Label>
        <Input type="number" min={0} value={startingPoints} onChange={(e) => setStartingPoints(e.target.value)} />
      </div>
      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
