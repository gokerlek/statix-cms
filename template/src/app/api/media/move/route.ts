import { NextRequest, NextResponse } from "next/server";

import { mediaMoveSchema, r2KeySchema } from "@/lib/api-schemas";
import { handleApiError } from "@/lib/api-response";
import { writeAudit, getIp } from "@/lib/audit";
import { getGitHubCMS } from "@/lib/github-cms";
import { extractR2Key, getPublicUrl, moveR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const parsed = mediaMoveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { currentUrl, currentPath, newFolder } = parsed.data;
    const sourceKey = currentPath ?? extractR2Key(currentUrl!);
    if (!sourceKey) {
      return NextResponse.json(
        { error: "Invalid media URL or path" },
        { status: 400 },
      );
    }

    const keyValidation = r2KeySchema.safeParse(sourceKey);
    if (!keyValidation.success) {
      return NextResponse.json(
        { error: keyValidation.error.issues[0]?.message ?? "Invalid source path" },
        { status: 400 },
      );
    }

    const filename = sourceKey.split("/").pop()!;
    const targetKey =
      !newFolder || newFolder === "default"
        ? `uploads/${filename}`
        : `uploads/${newFolder}/${filename}`;

    // R2'de taşı
    const oldUrl = currentUrl ?? getPublicUrl(sourceKey);
    const newUrl = await moveR2(sourceKey, targetKey);

    // GitHub content JSON'larında URL referanslarını güncelle
    const github = getGitHubCMS();
    const updatedFiles = await github.updateMediaReferences(oldUrl, newUrl, session.user);

    await writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "media.move",
      entityType: "media",
      entityId: targetKey,
      metadata: { fromKey: sourceKey, toKey: targetKey },
      ipAddress: getIp(request),
    });

    return NextResponse.json({
      success: true,
      newUrl,
      updatedFiles: updatedFiles.updatedFiles.length,
    });
  } catch (error) {
    return handleApiError(error, "Failed to move file");
  }
}
