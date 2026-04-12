import { NextResponse } from "next/server";

import { getContentIndex, isMediaOrphaned } from "@/lib/content-index";
import { listR2Media } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

    const [files, { index: contentIndex, ok: contentFetched }] = await Promise.all([
      listR2Media("uploads/"),
      getContentIndex(),
    ]);

    const filtered = files.filter(
      (file) =>
        !file.key.startsWith("uploads/uploads/") && !file.key.endsWith("/"),
    );

    const result = filtered.map((file) => ({
      name: file.key.split("/").pop() ?? file.key,
      path: file.key,
      url: file.url,
      size: file.size,
      lastModified: file.lastModified,
      // contentFetched=false → GitHub'a ulaşılamadı, orphaned bilinmiyor (false)
      // contentFetched=true → içerik başarıyla alındı, URL yoksa orphaned
      isOrphaned: contentFetched ? isMediaOrphaned(contentIndex, file.key.split("/").pop() ?? "") : false,
    }));

    return NextResponse.json(result);
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
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 },
    );
  }
}
