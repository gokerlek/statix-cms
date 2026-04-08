import { NextResponse } from "next/server";

import { getGitHubCMS } from "@/lib/github-cms";
import { listR2Media } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";
import { statixConfig } from "@/statix.config";

async function buildContentIndex(): Promise<{ index: string; ok: boolean }> {
  try {
    const github = getGitHubCMS();

    const collectionResults = await Promise.allSettled(
      statixConfig.collections.map(async (col) => {
        const files = await github.getCollection(col.path);
        const fileContents = await Promise.allSettled(
          files.map((f) => github.getFile(f.path)),
        );
        return fileContents
          .filter((r) => r.status === "fulfilled" && r.value?.content)
          .map((r) =>
            JSON.stringify((r as PromiseFulfilledResult<{ content: unknown }>).value.content),
          );
      }),
    );

    const index = collectionResults
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<string[]>).value)
      .join(" ");

    return { index, ok: true };
  } catch (err) {
    console.error("buildContentIndex error:", err);
    return { index: "", ok: false };
  }
}

export async function GET() {
  try {
    await requireAdmin();

    const [files, { index: contentIndex, ok: contentFetched }] = await Promise.all([
      listR2Media("uploads/"),
      buildContentIndex(),
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
      isOrphaned: contentFetched ? !contentIndex.includes(file.url) : false,
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
