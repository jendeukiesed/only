"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleBookmarkAction } from "@/actions/social/bookmarks";

export function BookmarkButton({ photoId, initialBookmarked }: { photoId: string; initialBookmarked: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        setBookmarked((prev) => !prev);
        startTransition(async () => {
          const result = await toggleBookmarkAction(photoId);
          if (!result.success) setBookmarked((prev) => !prev);
        });
      }}
    >
      <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
      {bookmarked ? "Saved" : "Save"}
    </Button>
  );
}
