"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createBundleAction } from "@/actions/admin/bundles";

interface CandidatePhoto {
  id: string;
  title: string;
  price: number;
  sellerUsername: string;
}

export function BundleForm({ candidatePhotos }: { candidatePhotos: CandidatePhoto[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!title.trim() || !description.trim() || !price || selected.size < 2) {
      toast.error("Fill in every field and pick at least 2 photos.");
      return;
    }
    startTransition(async () => {
      const result = await createBundleAction({
        title,
        description,
        price: Number(price),
        photoIds: [...selected],
      });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't create the bundle.");
        return;
      }
      toast.success("Bundle created.");
      setTitle("");
      setDescription("");
      setPrice("");
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Input placeholder="Bundle title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input
        type="number"
        min={1}
        max={2000}
        placeholder="Bundle price (points)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {candidatePhotos.map((photo) => (
          <label key={photo.id} className="flex items-center gap-2 rounded p-1.5 text-sm hover:bg-secondary/40">
            <Checkbox checked={selected.has(photo.id)} onCheckedChange={() => toggle(photo.id)} />
            <span className="flex-1 truncate">{photo.title}</span>
            <span className="text-xs text-muted-foreground">@{photo.sellerUsername} · {photo.price} pts</span>
          </label>
        ))}
      </div>

      <Button variant="brand" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Creating…" : `Create bundle (${selected.size} selected)`}
      </Button>
    </div>
  );
}
