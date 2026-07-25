"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFeaturedCreatorAction } from "@/actions/admin/featured";

export function FeaturedForm({ sellers }: { sellers: { id: string; username: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sellerId, setSellerId] = useState("");
  const [days, setDays] = useState("7");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerId) {
      toast.error("Choose a creator.");
      return;
    }
    startTransition(async () => {
      const result = await createFeaturedCreatorAction({ sellerId, days: Number(days) });
      if (!result.success) {
        toast.error("Something went wrong.");
        return;
      }
      toast.success("Creator featured.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select
        value={sellerId}
        onChange={(e) => setSellerId(e.target.value)}
        className="rounded-xl border border-border bg-background px-3.5 py-2 text-sm"
      >
        <option value="">Select a creator…</option>
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            @{s.username}
          </option>
        ))}
      </select>
      <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} className="w-24" />
      <span className="text-sm text-muted-foreground">days</span>
      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? "Featuring…" : "Feature creator"}
      </Button>
    </form>
  );
}
