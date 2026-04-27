import { NextRequest, NextResponse } from "next/server";

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
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    const references = await getFileReferences(key);

    return NextResponse.json(references);
  } catch (error) {
    console.error("Failed to get file references:", error);

    return NextResponse.json(
      { error: "Failed to get file references" },
      { status: 500 },
    );
  }
}
