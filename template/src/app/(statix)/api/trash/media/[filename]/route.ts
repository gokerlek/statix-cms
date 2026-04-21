import { NextRequest, NextResponse } from "next/server";

import { storageFilename } from "@/statix/lib/api-schemas";
import { handleApiError } from "@/statix/lib/api-response";
import { env } from "@/statix/lib/env";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

// Redirect to the R2 public URL for a trashed media file.
// Filename validation is centralized in `storageFilename`.
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requirePermission(P.MANAGE_TRASH);

    const { filename: rawFilename } = await context.params;
    const parsed = storageFilename.safeParse(rawFilename);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    const filename = parsed.data;

    if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) {
      return new NextResponse("Media base URL not configured", { status: 500 });
    }

    // R2 trash layout: trash/uploads/<filename>
    const r2Url = `${env.NEXT_PUBLIC_MEDIA_BASE_URL}/trash/uploads/${filename}`;

    return NextResponse.redirect(r2Url, { status: 302 });
  } catch (error) {
    return handleApiError(error, "Internal Server Error");
  }
}
