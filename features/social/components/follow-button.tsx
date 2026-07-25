"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/actions/social/follow";

export function FollowButton({ sellerId, initialFollowing }: { sellerId: string; initialFollowing: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  return (
    <Button
      variant={following ? "outline" : "brand"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleFollowAction(sellerId);
          if (!result.success) {
            toast.error(result.message ?? "Something went wrong.");
            return;
          }
          setFollowing(result.following);
          router.refresh();
        })
      }
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
