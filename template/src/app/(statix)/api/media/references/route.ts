import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/statix/lib/session";
import { getMediaReferences } from "@/statix/lib/media-utils";
import { P } from "@/statix/types/permissions";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_MEDIA);

    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 },
      );
    }

    const references = await getMediaReferences(filename);

    return NextResponse.json(references);
  } catch (error) {
    console.error("Failed to get media references:", error);

    return NextResponse.json(
      { error: "Failed to get media references" },
      { status: 500 },
    );
  }
}
