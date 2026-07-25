"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PointsDisplay } from "@/components/shared/points-display";
import { unlockBundleAction } from "@/actions/marketplace/unlock-bundle";

interface BundlePhoto {
  id: string;
  title: string;
  blurredUrl: string;
  url: string;
}

export function BundleReveal({
  bundleId,
  title,
  price,
  photos,
}: {
  bundleId: string;
  title: string;
  price: number;
  photos: BundlePhoto[];
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleUnlock() {
    setIsPending(true);
    const result = await unlockBundleAction(bundleId);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setRevealed(true);
    toast.success(`Bundle unlocked! ${photos.length} photos added to your collection.`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{photos.length} mystery photos, one purchase.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={revealed ? photo.url : photo.blurredUrl} alt={revealed ? photo.title : "Mystery photo"} className="size-full object-cover" />
            {!revealed && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <div className="glass glass-border flex size-10 items-center justify-center rounded-full">
                  <Lock className="size-4" />
                </div>
              </div>
            )}
            {revealed && (
              <div className="absolute right-1.5 top-1.5">
                <Badge variant="success"><Sparkles className="size-3" /></Badge>
              </div>
            )}
          </div>
        ))}
      </div>

      {!revealed ? (
        <Button variant="brand" size="lg" onClick={handleUnlock} disabled={isPending} className="w-full sm:w-auto">
          <Lock className="size-4" />
          {isPending ? "Unlocking…" : (
            <>
              Unlock bundle for <PointsDisplay amount={price} size="sm" className="text-brand-foreground" />
            </>
          )}
        </Button>
      ) : (
        <div className="flex justify-center gap-3">
          <Button variant="brand" onClick={() => router.push("/buyer/dashboard/collection")}>
            View in collection
          </Button>
          <Button variant="outline" onClick={() => router.push("/marketplace/bundles")}>
            Browse more bundles
          </Button>
        </div>
      )}
    </div>
  );
}
