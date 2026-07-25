"use client";

import { useEffect } from "react";

/** Registers public/sw.js once on mount — mounted once near the root of
 *  every authenticated layout (see app/layout.tsx). Renders nothing; this
 *  is a side-effect-only component, not UI. Silently no-ops in browsers
 *  without Service Worker support rather than throwing. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[service-worker] registration failed", error);
    });
  }, []);

  return null;
}
