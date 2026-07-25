import "server-only";
import webpush from "web-push";

let configured = false;

/** Lazily configures the `web-push` library with the project's VAPID key
 *  pair the first time it's actually needed, rather than at module import
 *  time — this file gets imported by services that also run in contexts
 *  (like tests) where the env vars intentionally aren't set. */
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@pawdrop.app";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured — run `npx web-push generate-vapid-keys` and set them in .env.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  link?: string;
}

/** Sends one push message to one subscribed device. Callers (see
 *  services/push/send-to-user.ts) are responsible for pruning a
 *  subscription when this throws a 404/410 (the browser unsubscribed or
 *  the endpoint expired) — this function's only job is the actual send. */
export async function sendWebPush(subscription: PushSubscriptionKeys, payload: PushPayload): Promise<void> {
  ensureConfigured();
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload),
  );
}

export function isVapidConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
