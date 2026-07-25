"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScoreTierBadge } from "@/components/shared/score-tier-badge";
import { approvePhotoAction, rejectPhotoAction } from "@/actions/admin/moderation";
import type { PhotoCardData } from "@/types/photo";

const MODERATION_FLAG_LABEL: Record<string, string> = {
  NEEDS_REVIEW: "AI flagged for review",
  LIKELY_DUPLICATE: "Possible duplicate",
  LIKELY_NOT_A_DOG: "May not be a dog",
};

export function ModerationCard({ photo }: { photo: PhotoCardData }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [resolved, setResolved] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePhotoAction(photo.id);
      if (result.success) {
        toast.success("Approved.");
        setResolved(true);
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      toast.error("Give a reason.");
      return;
    }
    startTransition(async () => {
      const result = await rejectPhotoAction({ photoId: photo.id, reason });
      if (result.success) {
        toast.success("Rejected.");
        setResolved(true);
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });
  }

  if (resolved) return null;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.title} className="size-full object-cover" />
        {photo.scoreTier && <div className="absolute left-2 top-2"><ScoreTierBadge tier={photo.scoreTier} /></div>}
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={photo.seller.image ?? undefined} />
            <AvatarFallback className="text-[10px]">{photo.seller.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">@{photo.seller.username}</span>
        </div>
        <p className="text-sm font-medium">{photo.title}</p>
        <p className="text-xs text-muted-foreground">
          Score {photo.overallScore ? Math.round(photo.overallScore) : "—"} · Price {photo.price} pts
        </p>

        {photo.moderationFlag !== "SAFE" && (
          <Badge variant="warning" className="gap-1">
            <TriangleAlert className="size-3" />
            {MODERATION_FLAG_LABEL[photo.moderationFlag] ?? photo.moderationFlag}
          </Badge>
        )}

        {!showReject ? (
          <div className="flex gap-2">
            <Button size="sm" variant="brand" className="flex-1" onClick={handleApprove} disabled={isPending}>
              <Check className="size-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowReject(true)} disabled={isPending}>
              <X className="size-4" /> Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection…"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1" onClick={handleReject} disabled={isPending}>
                Confirm reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowReject(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
