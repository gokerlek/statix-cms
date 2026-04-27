import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import { mediaMoveSchema, r2KeySchema } from "@/statix/lib/api-schemas";
import { getIp, writeAudit } from "@/statix/lib/audit";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import { extractR2Key, getPublicUrl, moveR2 } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

/**
 * Move a file under the R2 `files/` prefix to a different sub-folder
 * (or back to the root). Mirror of `/api/media/move` for documents:
 * copies the R2 object, rewrites content-JSON references that pointed
 * at the old URL, then drops the source.
 */
export async function POST(request: NextRequest) {
  try {
    const { session } = await requirePermission(P.MANAGE_FILES);

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
        { error: "Invalid file URL or path" },
        { status: 400 },
      );
    }

    if (!sourceKey.startsWith("files/")) {
      return NextResponse.json(
        { error: "Source key must start with files/" },
        { status: 400 },
      );
    }

    const keyValidation = r2KeySchema.safeParse(sourceKey);

    if (!keyValidation.success) {
      return NextResponse.json(
        {
          error:
            keyValidation.error.issues[0]?.message ?? "Invalid source path",
        },
        { status: 400 },
      );
    }

    const filename = sourceKey.split("/").pop()!;
    const targetKey =
      !newFolder || newFolder === "default"
        ? `files/${filename}`
        : `files/${newFolder}/${filename}`;

    if (sourceKey === targetKey) {
      return NextResponse.json(
        { error: "Source and target are the same — nothing to move" },
        { status: 400 },
      );
    }

    const oldUrl = currentUrl ?? getPublicUrl(sourceKey);

    // Each step has a distinct failure shape, so wrap them individually
    // and surface a precise error to the client instead of the generic
    // `handleApiError` fallback (which would say "Failed to move file"
    // without telling the user what actually broke).
    let newUrl: string;
    try {
      newUrl = await moveR2(sourceKey, targetKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "R2 move failed";
      return NextResponse.json(
        { error: `R2 move failed: ${msg}` },
        { status: 500 },
      );
    }

    // Files are persisted in content JSON as the **R2 key** (see
    // `FileField:109`), not the URL. So the move has to rewrite both
    // — otherwise `FieldField` reads the old key after the move and
    // the link breaks.
    const github = getGitHubCMS();
    let updated: { updatedFiles: string[] } = { updatedFiles: [] };
    try {
      updated = await github.updateMediaReferences(
        [
          { from: sourceKey, to: targetKey },
          { from: oldUrl, to: newUrl },
        ],
        session.user,
      );
    } catch (err) {
      // R2 already moved at this point. Surface the reference-update
      // failure so the operator can re-run or repair manually — but
      // don't fail the whole move; the file is at the new key already.
      console.error("Move: reference update failed", err);
    }

    await writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "file.move",
      entityType: "file",
      entityId: targetKey,
      metadata: { fromKey: sourceKey, toKey: targetKey },
      ipAddress: getIp(request),
    });

    // Both the file list (key changed) and the content index (refs were
    // rewritten) are now stale.
    revalidateTag("content-index", "max");

    return NextResponse.json({
      success: true,
      newUrl,
      updatedFiles: updated.updatedFiles.length,
    });
  } catch (error) {
    return handleApiError(error, "Failed to move file");
  }
}
