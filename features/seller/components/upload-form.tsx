"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { AgeCategory, EnergyLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBreakdown } from "@/features/ai-scoring/components/score-breakdown";
import { getUploadSignatureAction, createPhotoAction } from "@/actions/seller/upload";
import { titleCaseEnum } from "@/utils/format";
import type { AIScoreResponse } from "@/schemas/ai-scoring.schema";

interface UploadFormProps {
  categories: { id: string; name: string }[];
}

export function UploadForm({ categories }: UploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategory | "">("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [result, setResult] = useState<{ photoId: string; score: (AIScoreResponse & { modelUsed?: string }) | null } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a photo first.");
      return;
    }

    startTransition(async () => {
      try {
        const signature = await getUploadSignatureAction();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signature.apiKey);
        formData.append("timestamp", String(signature.timestamp));
        formData.append("signature", signature.signature);
        formData.append("folder", signature.folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const uploaded = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploaded.error?.message ?? "Upload failed.");

        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 8);

        const created = await createPhotoAction({
          title,
          description,
          cloudinaryPublicId: uploaded.public_id,
          url: uploaded.secure_url,
          width: uploaded.width,
          height: uploaded.height,
          breed,
          ageCategory: ageCategory || undefined,
          energyLevel: energyLevel || undefined,
          color,
          categoryId: categoryId || undefined,
          tags,
        });

        if (!created.success) {
          toast.error(created.message ?? "Something went wrong.");
          return;
        }

        toast.success("Photo uploaded! It's now pending admin review.");
        setResult({ photoId: created.photoId!, score: created.score });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed.");
      }
    });
  }

  if (result) {
    return (
      <div className="space-y-6">
        {result.score ? (
          <ScoreBreakdown score={result.score} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Scoring pending</CardTitle>
              <CardDescription>
                Your photo uploaded successfully, but scoring hit a snag — it's still pending
                admin review either way.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        <div className="flex gap-3">
          <Button variant="brand" onClick={() => router.push("/seller/dashboard/uploads")}>
            View my uploads
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setFile(null);
              setPreviewUrl(null);
              setTitle("");
              setDescription("");
            }}
          >
            Upload another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardContent className="p-5">
          <label
            htmlFor="photo-file"
            className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-border bg-secondary/40 text-center transition-colors hover:bg-secondary"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local
              // blob: object URL from the file picker, not a remote asset;
              // next/image's optimizer can't (and shouldn't) fetch it.
              <img src={previewUrl} alt="Preview" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <UploadCloud className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to choose a photo</p>
              </>
            )}
          </label>
          <input id="photo-file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Breed</Label>
            <Input value={breed} onChange={(e) => setBreed(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Age category</Label>
            <Select value={ageCategory} onValueChange={(v) => setAgeCategory(v as AgeCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
            <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v as EnergyLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tags (comma separated)</Label>
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="zoomies, beach-day" />
        </div>

        <Button type="submit" variant="brand" size="lg" disabled={isPending} className="w-full">
          {isPending ? "Uploading & scoring…" : "Upload photo"}
        </Button>
      </div>
    </form>
  );
}
