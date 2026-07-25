import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Toaster } from "sonner";

import { AuthSessionProvider } from "@/providers/session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ServiceWorkerRegistration } from "@/providers/service-worker-registration";
import "./globals.css";

// Nearly every page in the app reads session state and/or the database, so
// build-time static prerendering has nothing useful to capture — and would
// require a reachable, seeded database during `next build`. Rendering
// everything at request time keeps builds environment-independent.
export const dynamic = "force-dynamic";

// Two-font system: Inter for body copy/UI chrome (workhorse, excellent at
// small sizes), Sora for display headings (geometric, a little more
// characterful — hero copy, section titles, score reveals). Both exposed
// as CSS variables and wired into tailwind.config.ts's fontFamily so
// `font-sans` / `font-display` utility classes pick the right one.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "PawDrop — Unlock adorable dog photos",
    template: "%s · PawDrop",
  },
  description:
    "PawDrop is a marketplace where creators upload dog photos and collectors spend points to unlock mystery reveals.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PawDrop" },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} font-sans`}>
        <ThemeProvider>
          <AuthSessionProvider>
            <QueryProvider>
              {children}
              <Toaster richColors position="top-center" />
              <ServiceWorkerRegistration />
            </QueryProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
