import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/db/schema";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");

    let query = db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .$dynamic();

    if (entityType) {
      query = query.where(eq(auditLog.entityType, entityType));
    }

    if (userId) {
      query = query.where(eq(auditLog.userId, userId));
    }

    const logs = await query;

    return NextResponse.json(logs);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 },
      );
    }
    console.error("Audit log fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
