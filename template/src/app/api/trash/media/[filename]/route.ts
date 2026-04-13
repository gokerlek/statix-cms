import { NextRequest, NextResponse } from "next/server";

import { env } from "@/statix/lib/env";
import { handleApiError } from "@/statix/lib/api-response";
import { requireAdmin } from "@/statix/lib/session";

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
    return handleApiError(error, "Internal Server Error");
  }
}
