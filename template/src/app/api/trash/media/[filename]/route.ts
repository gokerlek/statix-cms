import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

// R2 trash'teki medyayı R2 URL'e yönlendir
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await context.params;

    if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) {
      return new NextResponse("Media base URL not configured", { status: 500 });
    }

    // R2'deki trash path: trash/uploads/filename
    const r2Url = `${env.NEXT_PUBLIC_MEDIA_BASE_URL}/trash/uploads/${filename}`;

    return NextResponse.redirect(r2Url, { status: 302 });
  } catch (error) {
    console.error("Trash media serve error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
