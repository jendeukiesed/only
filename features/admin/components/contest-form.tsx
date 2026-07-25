"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createContestAction } from "@/actions/admin/contests";

export function ContestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startsAt || !endsAt) {
      toast.error("Fill in every field.");
      return;
    }
    startTransition(async () => {
      const result = await createContestAction({
        title,
        description,
        period,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        firstPrizePoints: 200,
        secondPrizePoints: 100,
        thirdPrizePoints: 50,
      });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't create the contest.");
        return;
      }
      toast.success("Contest created.");
      setTitle("");
      setDescription("");
      setStartsAt("");
      setEndsAt("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input placeholder="Contest title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as "WEEKLY" | "MONTHLY")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </div>
      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? "Creating…" : "Create contest"}
      </Button>
    </form>
  );
}
