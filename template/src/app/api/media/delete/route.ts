import { NextRequest, NextResponse } from "next/server";

import { extractR2Key, softDeleteR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { url, key } = body;

    // key doğrudan veya URL'den çıkarılabilir
    const r2Key = key || (url ? extractR2Key(url) : null);

    if (!r2Key) {
      return NextResponse.json(
        { error: "Media key or URL is required" },
        { status: 400 },
      );
    }

    const trashKey = await softDeleteR2(r2Key);

    return NextResponse.json({ success: true, trashKey });
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
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 },
    );
  }
}
