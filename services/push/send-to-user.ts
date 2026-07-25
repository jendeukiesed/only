import "server-only";
import { db } from "@/lib/db/prisma";
import { sendWebPush, isVapidConfigured, type PushPayload } from "@/lib/push/web-push";

/**
 * Fans a push notification out to every device a user has subscribed
 * from (see PushSubscription — a user can have several). Called as a
 * best-effort side channel from services/notifications/create.ts, never
 * inline in a request path that needs to succeed on its own: a push
 * provider hiccup should never be the reason a mutation fails.
 *
 * A subscription whose send comes back 404/410 means the browser has
 * unsubscribed or the endpoint expired — pruned immediately so the same
 * dead subscription doesn't get retried on every future notification.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isVapidConfigured()) return; // no-op in local dev without VAPID keys set

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload);
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        } else {
          console.error("[push/send-to-user] send failed", { userId, error });
        }
      }
    }),
  );
}
