"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toggleAnnouncementActiveAction } from "@/actions/admin/announcements";

export function AnnouncementToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={() =>
        startTransition(async () => {
          await toggleAnnouncementActiveAction(id);
          router.refresh();
        })
      }
    />
  );
}
