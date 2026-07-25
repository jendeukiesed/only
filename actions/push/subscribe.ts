"use server";

import { db } from "@/lib/db/prisma";
import { assertUser } from "@/lib/auth/rbac";
import { subscribePushSchema, unsubscribePushSchema, type SubscribePushInput } from "@/schemas/push.schema";

export async function subscribePushAction(input: SubscribePushInput) {
  const user = await assertUser();
  const parsed = subscribePushSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid subscription." };

  // Upsert on `endpoint` (globally unique per browser subscription): the
  // same device re-subscribing after a token refresh replaces its keys
  // rather than creating a duplicate row for the same PushSubscription
  // endpoint.
  await db.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: { userId: user.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    create: {
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  return { success: true };
}

export async function unsubscribePushAction(input: { endpoint: string }) {
  await assertUser();
  const parsed = unsubscribePushSchema.safeParse(input);
  if (!parsed.success) return { success: false };

  await db.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } });
  return { success: true };
}
