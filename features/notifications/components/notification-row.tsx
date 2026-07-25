"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/utils/format";
import { markNotificationReadAction } from "@/actions/buyer/notifications";
import { cn } from "@/lib/utils";

interface NotificationRowProps {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationRow({ id, title, body, link, isRead, createdAt }: NotificationRowProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleClick() {
    if (!isRead) {
      startTransition(async () => {
        await markNotificationReadAction(id);
        router.refresh();
      });
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border p-4 transition-colors",
        !isRead && "bg-secondary/40",
      )}
    >
      {!isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />}
      <div className={cn("min-w-0 flex-1", isRead && "pl-5")}>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(createdAt)}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return <button onClick={handleClick} className="w-full text-left">{content}</button>;
}
