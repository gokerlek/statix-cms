import { NextResponse } from "next/server";

import { getMediaStats } from "@/statix/lib/dashboard-data";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export async function GET() {
  try {
    await requirePermission(P.MANAGE_MEDIA);

    const stats = await getMediaStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch media stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch media stats" },
      { status: 500 },
    );
  }
}
