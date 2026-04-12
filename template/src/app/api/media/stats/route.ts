import { NextResponse } from "next/server";

import { getMediaStats } from "@/lib/dashboard-data";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

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
