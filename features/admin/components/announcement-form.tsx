"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncementAction } from "@/actions/admin/announcements";

export function AnnouncementForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAnnouncementAction({ title, body });
      if (!result.success) {
        toast.error(result.message ?? "Something went wrong.");
        return;
      }
      toast.success("Announcement published.");
      setTitle("");
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={3} required />
      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? "Publishing…" : "Publish announcement"}
      </Button>
    </form>
  );
}
