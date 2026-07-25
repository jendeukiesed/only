"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voteContestEntryAction } from "@/actions/contests/vote";

export function VoteButton({ entryId, disabled }: { entryId: string; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState(false);

  function handleVote() {
    startTransition(async () => {
      const result = await voteContestEntryAction({ entryId });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't cast your vote.");
        return;
      }
      setVoted(true);
      toast.success("Vote cast!");
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant={voted ? "secondary" : "brand"}
      className="w-full"
      disabled={disabled || isPending || voted}
      onClick={handleVote}
    >
      <ThumbsUp className="size-4" />
      {voted ? "Voted" : "Vote"}
    </Button>
  );
}
