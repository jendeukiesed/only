import "server-only";
import { NextResponse } from "next/server";

/**
 * Every cron route (app/api/cron/**) is a public HTTP endpoint by
 * necessity — Vercel Cron and the GitHub Actions scheduled workflow both
 * invoke it as a plain HTTP GET with no user session. Gate it with a
 * shared-secret bearer token instead so it can't be triggered by anyone
 * who finds the URL. Vercel Cron automatically sends this header when
 * `CRON_SECRET` is set in the project's environment variables; the GitHub
 * Actions fallback workflow (.github/workflows/cron.yml) sends it too.
 */
export function verifyCronRequest(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  // Local dev with no CRON_SECRET configured: allow the request through so
  // `curl localhost:3000/api/cron/...` works without extra setup, but never
  // do this in production.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
    }
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
