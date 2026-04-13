import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/statix/db/schema";
import { handleApiError } from "@/statix/lib/api-response";
import { db } from "@/statix/lib/db";
import { requireAdmin } from "@/statix/lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");

    const conditions = [
      ...(entityType ? [eq(auditLog.entityType, entityType)] : []),
      ...(userId ? [eq(auditLog.userId, userId)] : []),
    ];

    const logs = await db
      .select()
      .from(auditLog)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return NextResponse.json(logs);
  } catch (error) {
    return handleApiError(error, "Failed to fetch audit logs");
  }
}
