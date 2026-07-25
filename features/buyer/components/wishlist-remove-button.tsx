"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleWishlistAction } from "@/actions/buyer/wishlist";

export function WishlistRemoveButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleWishlistAction(photoId);
          if (result.success) {
            toast.success("Removed from wishlist");
            router.refresh();
          }
        })
      }
    >
      <Heart className="size-4 fill-current" />
      {isPending ? "Removing…" : "Remove from wishlist"}
    </Button>
  );
}
