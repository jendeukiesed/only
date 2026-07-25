"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategoryAction } from "@/actions/admin/categories";

export function CategoryForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCategoryAction({ name, icon });
      if (!result.success) {
        toast.error(result.message ?? "Something went wrong.");
        return;
      }
      toast.success("Category created.");
      setName("");
      setIcon("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="max-w-xs" required />
      <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Emoji" className="w-20" />
      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? "Adding…" : "Add category"}
      </Button>
    </form>
  );
}
