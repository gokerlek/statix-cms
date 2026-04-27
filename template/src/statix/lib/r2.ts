import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "./env";

export function getR2Client() {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "R2 credentials are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function getBucket() {
  if (!env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured.");
  }
  return env.R2_BUCKET_NAME;
}

export function getPublicUrl(key: string): string {
  if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) {
    throw new Error("NEXT_PUBLIC_MEDIA_BASE_URL is not configured.");
  }
  return `${env.NEXT_PUBLIC_MEDIA_BASE_URL}/${key}`;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const r2 = getR2Client();
  const bucket = getBucket();

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return getPublicUrl(key);
}

/**
 * Encode each path segment for the `x-amz-copy-source` HTTP header.
 * AWS SDK v3 doesn't auto-encode this value, so any non-ASCII byte in
 * the key (Turkish letters, spaces, parentheses, …) trips
 * "Invalid character in header content". Slashes stay literal so the
 * key structure is preserved.
 */
function encodeCopySource(bucket: string, key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${bucket}/${encoded}`;
}

// Soft delete: uploads/img.jpg → trash/uploads/img.jpg (metadata ile)
export async function softDeleteR2(key: string): Promise<string> {
  const r2 = getR2Client();
  const bucket = getBucket();
  const trashKey = `trash/${key}`;

  await r2.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: encodeCopySource(bucket, key),
      Key: trashKey,
      Metadata: {
        "original-key": key,
        "deleted-at": new Date().toISOString(),
      },
      MetadataDirective: "REPLACE",
    }),
  );

  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

  return trashKey;
}

// Restore: trash/uploads/img.jpg → uploads/img.jpg
export async function restoreR2(trashKey: string): Promise<string> {
  const r2 = getR2Client();
  const bucket = getBucket();
  const originalKey = trashKey.replace(/^trash\//, "");

  await r2.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: encodeCopySource(bucket, trashKey),
      Key: originalKey,
    }),
  );

  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: trashKey }));

  return getPublicUrl(originalKey);
}

// Kalıcı sil
export async function deleteFromR2(key: string): Promise<void> {
  const r2 = getR2Client();
  const bucket = getBucket();
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// R2'den URL'deki key'i çıkar
export function extractR2Key(url: string): string | null {
  if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) return null;
  if (!url.startsWith(env.NEXT_PUBLIC_MEDIA_BASE_URL)) return null;
  return url.replace(`${env.NEXT_PUBLIC_MEDIA_BASE_URL}/`, "");
}

export interface R2TrashItem {
  trashKey: string;
  originalKey: string;
  deletedAt: string | null;
  size: number;
  type: "media";
}

// Trash'teki medya dosyalarını listele
export async function listR2Trash(): Promise<R2TrashItem[]> {
  const r2 = getR2Client();
  const bucket = getBucket();

  const list = await r2.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "trash/",
    }),
  );

  if (!list.Contents || list.Contents.length === 0) return [];

  const items = await Promise.all(
    list.Contents.map(async (obj) => {
      const head = await r2.send(
        new HeadObjectCommand({ Bucket: bucket, Key: obj.Key! }),
      );
      return {
        trashKey: obj.Key!,
        originalKey:
          head.Metadata?.["original-key"] ??
          obj.Key!.replace(/^trash\//, ""),
        deletedAt: head.Metadata?.["deleted-at"] ?? null,
        size: obj.Size ?? 0,
        type: "media" as const,
      };
    }),
  );

  return items;
}

// R2'de dosya taşı (media move için)
export async function moveR2(
  sourceKey: string,
  targetKey: string,
): Promise<string> {
  const r2 = getR2Client();
  const bucket = getBucket();

  await r2.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: encodeCopySource(bucket, sourceKey),
      Key: targetKey,
    }),
  );

  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }));

  return getPublicUrl(targetKey);
}

// uploads/ prefix'li medyayı listele (cursor tabanlı, trash hariç)
export async function listR2Media(
  prefix = "uploads/",
  options: { cursor?: string; limit?: number } = {},
): Promise<{
  items: Array<{ key: string; url: string; size: number; lastModified: Date | undefined }>;
  nextCursor: string | undefined;
}> {
  const r2 = getR2Client();
  const bucket = getBucket();
  const { cursor, limit = 50 } = options;

  const list = await r2.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: limit,
      ContinuationToken: cursor,
    }),
  );

  return {
    items: (list.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      url: getPublicUrl(obj.Key!),
      size: obj.Size ?? 0,
      lastModified: obj.LastModified,
    })),
    nextCursor: list.IsTruncated ? list.NextContinuationToken : undefined,
  };
}
