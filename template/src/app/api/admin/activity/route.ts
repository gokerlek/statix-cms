import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/session";
import { getUnifiedActivity } from "@/lib/activity-feed";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get("limit") ?? "20"),
      100,
    );

    const result = await getUnifiedActivity({ limit, cursor });
    return NextResponse.json(result);
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
    console.error("Activity feed error:", error);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
