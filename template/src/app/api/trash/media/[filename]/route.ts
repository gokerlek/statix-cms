import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

// R2 trash'teki medyayı R2 URL'e yönlendir
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { filename } = await context.params;

    // Only allow safe filenames — prevent path traversal
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 },
      );
    }

    if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) {
      return new NextResponse("Media base URL not configured", { status: 500 });
    }

    // R2'deki trash path: trash/uploads/filename
    const r2Url = `${env.NEXT_PUBLIC_MEDIA_BASE_URL}/trash/uploads/${filename}`;

    return NextResponse.redirect(r2Url, { status: 302 });
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
    console.error("Trash media serve error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
