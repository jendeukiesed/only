import "server-only";
import { db } from "@/lib/db/prisma";

interface AuditLogInput {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/** Every admin mutation (approve/reject, suspend/ban, point adjustment,
 *  category/announcement/settings changes) writes one of these — the
 *  spec's "View logs" admin capability needs a real trail, not just a
 *  vague promise of one. */
export async function logAdminAction(input: AuditLogInput) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    },
  });
}
