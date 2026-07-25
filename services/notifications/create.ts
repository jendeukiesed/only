import "server-only";
import { db } from "@/lib/db/prisma";
import type { NotificationType } from "@prisma/client";
import { sendPushToUser } from "@/services/push/send-to-user";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/** Every in-app notification (follows, likes, comments, approvals,
 *  achievements, level-ups, mission completions, admin notices) is created
 *  through this one function — actions/services never call
 *  `db.notification.create` directly, so the shape stays consistent.
 *
 *  It also fans out to Web Push (see services/push/send-to-user.ts) as a
 *  best-effort side channel: the in-app Notification row is always the
 *  source of truth (it's what the notification bell/inbox reads), a push
 *  is just a bonus real-time nudge if the browser is subscribed and never
 *  something this function's caller needs to wait on or handle failures
 *  for. */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      metadata: input.metadata,
    },
  });

  sendPushToUser(input.userId, { title: input.title, body: input.body, link: input.link }).catch((error) =>
    console.error("[notifications/create] push fan-out failed", error),
  );

  return notification;
}
