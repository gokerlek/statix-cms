import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMediaReferences } from "@/lib/media-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
