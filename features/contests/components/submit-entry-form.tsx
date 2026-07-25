"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitContestEntryAction } from "@/actions/contests/entries";

export function SubmitEntryForm({
  contestId,
  eligiblePhotos,
}: {
  contestId: string;
  eligiblePhotos: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [photoId, setPhotoId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!photoId) {
      toast.error("Choose a photo to enter.");
      return;
    }
    startTransition(async () => {
      const result = await submitContestEntryAction({ contestId, photoId });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't submit your entry.");
        return;
      }
      toast.success("Entered! Good luck.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-premium">
      <Select value={photoId} onValueChange={setPhotoId}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Choose one of your approved photos" />
        </SelectTrigger>
        <SelectContent>
          {eligiblePhotos.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="brand" size="sm" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Entering…" : "Enter this contest"}
      </Button>
    </div>
  );
}
