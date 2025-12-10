import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getGitHubCMS } from "@/lib/github-cms";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const github = getGitHubCMS();

    // Lazy cleanup: Check for old items and delete them
    // We do this in the background so we don't block the response too much
    // But for simplicity in serverless, we'll await it or fire and forget if possible.
    // Since Vercel functions can die early, we should await it to be safe,
    // or use a separate cron job. For this requirement, "Lazy cleanup" implies doing it on access.
    await github.cleanupTrash(10); // 10 days retention

    const items = await github.getTrashItems();

    return NextResponse.json(items);
  } catch (error) {
    console.error("Trash list error:", error);

    return NextResponse.json(
      { error: "Failed to fetch trash items" },
      { status: 500 },
    );
  }
}
