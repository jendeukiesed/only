"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Lock, Check, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScoreTierBadge } from "@/components/shared/score-tier-badge";
import { PointsDisplay } from "@/components/shared/points-display";
import { hoverLift, scaleIn } from "@/lib/constants/motion";
import { titleCaseEnum } from "@/utils/format";
import type { PhotoCardData } from "@/types/photo";

type PhotoCardVariant = "locked" | "unlocked" | "seller";

interface PhotoCardProps {
  photo: PhotoCardData;
  variant: PhotoCardVariant;
  onUnlock?: () => void;
  isUnlocking?: boolean;
  actions?: React.ReactNode;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending review", icon: Clock, badgeVariant: "warning" as const },
  APPROVED: { label: "Live", icon: Check, badgeVariant: "success" as const },
  REJECTED: { label: "Rejected", icon: XCircle, badgeVariant: "destructive" as const },
  WITHDRAWN: { label: "Withdrawn", icon: XCircle, badgeVariant: "outline" as const },
};

/**
 * The single card component every photo grid in the app renders (Stage 8
 * marketplace, Stage 6 buyer collection/wishlist, Stage 7 seller upload
 * list) — one visual language for "a dog photo" everywhere, driven by
 * `variant` rather than three separate card implementations drifting apart.
 */
export function PhotoCard({ photo, variant, onUnlock, isUnlocking, actions }: PhotoCardProps) {
  const isLocked = variant === "locked";
  const imageSrc = isLocked ? photo.blurredUrl : photo.url;
  const statusConfig = STATUS_CONFIG[photo.status];

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      whileHover={hoverLift}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-premium transition-shadow hover:shadow-premium-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
        <Image
          src={imageSrc}
          alt={isLocked ? "Mystery photo — unlock to reveal" : photo.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {photo.scoreTier && <ScoreTierBadge tier={photo.scoreTier} />}
          {variant === "seller" && (
            <Badge variant={statusConfig.badgeVariant}>
              <statusConfig.icon className="size-3" />
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/10">
            <div className="glass glass-border flex size-14 items-center justify-center rounded-full">
              <Lock className="size-6 text-foreground" />
            </div>
          </div>
        )}

        {!isLocked && variant !== "seller" && (
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="glass">
              <Check className="size-3 text-success" /> Unlocked
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-sm font-semibold">
            {isLocked ? "Mystery photo" : photo.title}
          </h3>
          <PointsDisplay amount={photo.price} size="sm" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {photo.breed && (
            <Badge variant="outline" className="text-[11px]">
              {photo.breed}
            </Badge>
          )}
          {photo.energyLevel && (
            <Badge variant="outline" className="text-[11px]">
              {titleCaseEnum(photo.energyLevel)}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={photo.seller.image ?? undefined} alt={photo.seller.username} />
              <AvatarFallback className="text-[10px]">
                {(photo.seller.name ?? photo.seller.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">@{photo.seller.username}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" /> {photo.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" /> {photo.commentCount}
            </span>
          </div>
        </div>

        {isLocked && onUnlock && (
          <Button variant="brand" className="w-full" onClick={onUnlock} disabled={isUnlocking}>
            <Lock className="size-4" />
            {isUnlocking ? "Unlocking…" : `Unlock for ${photo.price}`}
          </Button>
        )}

        {actions}
      </div>
    </motion.div>
  );
}
