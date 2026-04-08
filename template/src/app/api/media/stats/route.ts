import { NextResponse } from "next/server";

import { getMediaStats } from "@/lib/dashboard-data";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
