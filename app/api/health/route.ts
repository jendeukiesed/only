import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe for the Docker HEALTHCHECK (docker/Dockerfile)
 * and any orchestrator (Kubernetes, ECS, Fly.io) in front of it. Confirms
 * not just that the Node process is up but that it can actually reach
 * Postgres — a container that's "running" but can't talk to its database
 * should be reported unhealthy so the orchestrator restarts/reroutes it.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    console.error("[health] database check failed", error);
    return NextResponse.json({ status: "error", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
