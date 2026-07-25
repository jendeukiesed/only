"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/modals/confirm-dialog";
import { withdrawPhotoAction } from "@/actions/seller/listings";

export function WithdrawButton({ photoId }: { photoId: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" className="w-full">
          <Trash2 className="size-4" /> Withdraw
        </Button>
      }
      title="Withdraw this listing?"
      description="It will be removed from the marketplace immediately. Existing unlocks, likes, and comments are kept."
      confirmLabel="Withdraw"
      variant="destructive"
      onConfirm={async () => {
        const result = await withdrawPhotoAction(photoId);
        if (!result.success) {
          toast.error("Something went wrong.");
          return;
        }
        toast.success("Listing withdrawn.");
        router.refresh();
      }}
    />
  );
}
