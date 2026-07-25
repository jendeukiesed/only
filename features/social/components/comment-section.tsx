"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pin, Reply as ReplyIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createCommentAction, togglePinCommentAction } from "@/actions/social/comments";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { CommentData } from "@/types/comment";

export function CommentSection({
  photoId,
  initialComments,
  canPin,
}: {
  photoId: string;
  initialComments: CommentData[];
  canPin: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitTopLevel(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await createCommentAction({ photoId, body });
      if (!result.success) {
        toast.error(result.message ?? "Something went wrong.");
        return;
      }
      setBody("");
      toast.success("Comment posted.");
      // Optimistic local append isn't reconciled with the server row id,
      // so just prompt a refresh-worthy state — simplest correct approach
      // here is a full reload of the thread from the server on next visit;
      // for immediate feedback we splice a placeholder in locally.
      setComments((prev) => [
        {
          id: result.commentId!,
          body,
          isPinned: false,
          createdAt: new Date().toISOString(),
          user: { id: "me", username: "you", name: "You", image: null },
          replies: [],
        },
        ...prev,
      ]);
    });
  }

  function submitReply(parentId: string) {
    if (!replyBody.trim()) return;
    startTransition(async () => {
      const result = await createCommentAction({ photoId, body: replyBody, parentId });
      if (!result.success) {
        toast.error(result.message ?? "Something went wrong.");
        return;
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    id: result.commentId!,
                    body: replyBody,
                    isPinned: false,
                    createdAt: new Date().toISOString(),
                    user: { id: "me", username: "you", name: "You", image: null },
                    replies: [],
                  },
                ],
              }
            : c,
        ),
      );
      setReplyBody("");
      setReplyTo(null);
    });
  }

  function handlePin(commentId: string) {
    startTransition(async () => {
      const result = await togglePinCommentAction(commentId);
      if (!result.success) return;
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, isPinned: !c.isPinned } : c)));
    });
  }

  const sorted = [...comments].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <div className="space-y-5">
      <form onSubmit={submitTopLevel} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          maxLength={1000}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="brand" disabled={isPending || !body.trim()}>
            Post
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {sorted.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <div className="flex gap-3">
              <Avatar className="size-8">
                <AvatarImage src={comment.user.image ?? undefined} />
                <AvatarFallback>{(comment.user.name ?? comment.user.username).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">@{comment.user.username}</span>
                  {comment.isPinned && (
                    <Badge variant="outline" className="text-[10px]">
                      <Pin className="size-2.5" /> Pinned
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm">{comment.body}</p>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  >
                    <ReplyIcon className="size-3" /> Reply
                  </button>
                  {canPin && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handlePin(comment.id)}
                    >
                      {comment.isPinned ? "Unpin" : "Pin"}
                    </button>
                  )}
                </div>

                {replyTo === comment.id && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={`Reply to @${comment.user.username}…`}
                      rows={2}
                    />
                    <Button size="sm" variant="outline" onClick={() => submitReply(comment.id)} disabled={isPending}>
                      Reply
                    </Button>
                  </div>
                )}

                {comment.replies.length > 0 && (
                  <div className="mt-3 space-y-3 border-l-2 border-border pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className={cn("flex gap-2")}>
                        <Avatar className="size-6">
                          <AvatarImage src={reply.user.image ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(reply.user.name ?? reply.user.username).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">@{reply.user.username}</span>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(reply.createdAt)}</span>
                          </div>
                          <p className="text-sm">{reply.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
