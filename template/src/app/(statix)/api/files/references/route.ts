import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import { r2KeySchema } from "@/statix/lib/api-schemas";
import { getFileReferences } from "@/statix/lib/media-utils";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

/**
 * Look up which content JSONs reference a given file (by R2 key).
 * Mirror of `/api/media/references` for the files bucket — same
 * `{path, title, collection}[]` response shape so the UI can use
 * one display path.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_FILES);

    const { searchParams } = request.nextUrl;
    const rawKey = searchParams.get("key");

    if (!rawKey) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    // Reject path-traversal / encoded-traversal / cross-prefix keys here so
    // the index lookup downstream never sees raw user input.
    const parsed = r2KeySchema.safeParse(rawKey);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid file key" },
        { status: 400 },
      );
    }

    const references = await getFileReferences(parsed.data);

    return NextResponse.json(references);
  } catch (error) {
    return handleApiError(error, "Failed to get file references", request);
  }
}
