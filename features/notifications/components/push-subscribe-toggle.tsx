"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribePushAction, unsubscribePushAction } from "@/actions/push/subscribe";
import { urlBase64ToUint8Array } from "@/utils/push";

type Status = "unsupported" | "checking" | "subscribed" | "unsubscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Self-contained settings-page control for enabling/disabling Web Push
 *  on this browser. No props — it reads its own subscription state from
 *  the Push API on mount, since that's device-local state the server
 *  doesn't (and can't cheaply) know without asking the browser first. */
export function PushSubscribeToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsupported"));
  }, []);

  function handleEnable() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Push notifications aren't configured for this deployment yet.");
      return;
    }
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notification permission was denied.");
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const json = subscription.toJSON();
        await subscribePushAction({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        });
        setStatus("subscribed");
        toast.success("Push notifications enabled.");
      } catch (error) {
        console.error("[push-subscribe-toggle] enable failed", error);
        toast.error("Couldn't enable push notifications.");
      }
    });
  }

  function handleDisable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await unsubscribePushAction({ endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
        setStatus("unsubscribed");
        toast.success("Push notifications disabled.");
      } catch (error) {
        console.error("[push-subscribe-toggle] disable failed", error);
        toast.error("Couldn't disable push notifications.");
      }
    });
  }

  if (status === "unsupported") return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <div>
        <p className="text-sm font-medium">Push notifications</p>
        <p className="text-xs text-muted-foreground">Get a browser notification for likes, unlocks, and approvals.</p>
      </div>
      {status === "subscribed" ? (
        <Button variant="outline" size="sm" onClick={handleDisable} disabled={isPending}>
          <BellOff className="size-4" /> Disable
        </Button>
      ) : (
        <Button variant="brand" size="sm" onClick={handleEnable} disabled={isPending || status === "checking"}>
          <Bell className="size-4" /> Enable
        </Button>
      )}
    </div>
  );
}
