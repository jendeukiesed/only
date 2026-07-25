/** The Push API's `applicationServerKey` option wants a raw Uint8Array,
 *  but VAPID public keys are normally shared/stored as a URL-safe base64
 *  string (see NEXT_PUBLIC_VAPID_PUBLIC_KEY) — this is the standard
 *  conversion every Web Push guide uses. Client-only (uses `atob`). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
