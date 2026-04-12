import { lt } from "drizzle-orm";

import { auditLog } from "@/db/schema";

import { db } from "./db";

export async function writeAudit(params: {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  // Fire-and-forget — errors must never break the main request flow
  await db
    .insert(auditLog)
    .values({
      id: crypto.randomUUID(),
      userId: params.userId ?? null,
      userEmail: params.userEmail ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress ?? null,
      createdAt: new Date(),
    })
    .catch((e) => console.error("[audit]", e));
}

import { getClientIp } from "@/lib/rate-limit";

/** Extracts client IP from request — delegates to shared getClientIp */
export function getIp(request: Request): string | null {
  return getClientIp(request.headers) || null;
}

export async function cleanupOldAuditLogs(daysToKeep = 90) {
  const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  await db.delete(auditLog).where(lt(auditLog.createdAt, cutoff));
}
