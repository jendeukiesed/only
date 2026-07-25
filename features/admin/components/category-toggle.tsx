"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toggleCategoryActiveAction } from "@/actions/admin/categories";

export function CategoryToggle({ categoryId, isActive }: { categoryId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={() =>
        startTransition(async () => {
          await toggleCategoryActiveAction(categoryId);
          router.refresh();
        })
      }
    />
  );
}
