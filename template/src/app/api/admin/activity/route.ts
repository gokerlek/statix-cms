import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import { requirePermission } from "@/statix/lib/session";
import { getUnifiedActivity } from "@/statix/lib/activity-feed";
import { P } from "@/statix/types/permissions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(P.VIEW_MONITOR);

    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get("limit") ?? "20"),
      100,
    );

    const result = await getUnifiedActivity({ limit, cursor });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to load activity");
  }
}
