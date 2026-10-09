import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

let cachedS3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedS3Client) return cachedS3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing");
  }

  cachedS3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  return cachedS3Client;
}

/**
 * Checks if a URL is already hosted on Dolcake's Cloudflare R2 / CDN.
 */
export function isDolcakeMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("media.dolcake.com") ||
    url.includes("r2.dev") ||
    url.includes("r2.cloudflarestorage.com")
  );
}

/**
 * Downloads an external image URL (or parses a base64 Data URI),
 * compresses and converts it to WebP (max 600x600, ~20-50KB) via Sharp,
 * and uploads it directly to Cloudflare R2 with immutable cache headers.
 * 
 * If download or processing fails, it gracefully falls back to the original URL.
 */
export async function optimizeAndUploadToR2(
  imageUrl: string | null | undefined,
  subFolder = "uploads"
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
    return imageUrl || null;
  }

  const cleanUrl = imageUrl.trim();

  // If already on our CDN / R2, return as-is immediately
  if (isDolcakeMediaUrl(cleanUrl)) {
    return cleanUrl;
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL || "https://media.dolcake.com";

  if (!bucketName) {
    console.warn("[optimizeAndUploadToR2] R2_BUCKET_NAME is not configured");
    return cleanUrl;
  }

  try {
    let rawBuffer: Buffer;

    if (cleanUrl.startsWith("data:")) {
      const base64Content = cleanUrl.includes("base64,")
        ? cleanUrl.split("base64,")[1]
        : cleanUrl;
      rawBuffer = Buffer.from(base64Content, "base64");
    } else if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(cleanUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: cleanUrl,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[optimizeAndUploadToR2] Failed to fetch external image (${response.status}): ${cleanUrl}`);
        return cleanUrl;
      }

      const arrayBuffer = await response.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuffer);
    } else {
      // Relative path or local asset
      return cleanUrl;
    }

    if (!rawBuffer || rawBuffer.length === 0) {
      return cleanUrl;
    }

    // Compress & convert to WebP using Sharp
    const webpBuffer = await sharp(rawBuffer)
      .rotate() // Respect EXIF orientation
      .resize({
        width: 600,
        height: 600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    const fileName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
    const key = `${subFolder}/${fileName}`;

    const s3Client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: webpBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    });

    await s3Client.send(command);

    const finalUrl = `${publicUrlBase.replace(/\/$/, "")}/${key}`;
    return finalUrl;
  } catch (error: any) {
    console.warn(`[optimizeAndUploadToR2] Error optimizing image (${cleanUrl}):`, error.message);
    // Graceful fallback: return original URL so user experience is not interrupted
    return cleanUrl;
  }
}

/**
 * Takes an array of candidate image URLs (from search results),
 * tries them in order, downloads and compresses the first working one via Sharp,
 * and uploads it directly to Cloudflare R2 as WebP.
 * 
 * If a candidate gives 403, 404, or fails to decode, it automatically tries the next candidate.
 */
export async function optimizeAndUploadFirstValidToR2(
  urls: string[],
  subFolder = "uploads"
): Promise<string | null> {
  if (!urls || urls.length === 0) return null;

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL || "https://media.dolcake.com";

  for (const url of urls) {
    if (!url || typeof url !== "string" || !url.trim()) continue;
    const cleanUrl = url.trim();

    if (isDolcakeMediaUrl(cleanUrl)) {
      return cleanUrl;
    }

    try {
      let rawBuffer: Buffer | null = null;
      if (cleanUrl.startsWith("data:")) {
        const base64Content = cleanUrl.includes("base64,") ? cleanUrl.split("base64,")[1] : cleanUrl;
        rawBuffer = Buffer.from(base64Content, "base64");
      } else if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(cleanUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            Referer: cleanUrl,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.warn(`[optimizeAndUploadFirstValidToR2] Candidate failed (${res.status}): ${cleanUrl}`);
          continue;
        }

        const arrayBuffer = await res.arrayBuffer();
        rawBuffer = Buffer.from(arrayBuffer);
      }

      if (!rawBuffer || rawBuffer.length === 0) continue;

      const webpBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      if (!bucketName) continue;

      const fileName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
      const key = `${subFolder}/${fileName}`;
      const s3Client = getR2Client();

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: webpBuffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      return `${publicUrlBase.replace(/\/$/, "")}/${key}`;
    } catch (e: any) {
      console.warn(`[optimizeAndUploadFirstValidToR2] Candidate skipped (${cleanUrl}):`, e.message);
      continue;
    }
  }

  // If none could be downloaded, fallback to first non-empty URL
  return urls.find((u) => Boolean(u && u.trim())) || null;
}

/**
 * Background migration worker for any topic items that still have external URLs.
 * Runs non-blocking in the background when game routes are accessed.
 */
export async function migrateTopicImagesInBackground(topicId: string): Promise<void> {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const items = await prisma.matchWordItem.findMany({
      where: { topicId },
    });

    for (const item of items) {
      let updatedImageUrl = item.imageUrl;
      let updatedImageBUrl = item.imageBUrl;
      let shouldUpdate = false;

      if (
        item.imageUrl &&
        !isDolcakeMediaUrl(item.imageUrl) &&
        (item.imageUrl.startsWith("http://") || item.imageUrl.startsWith("https://"))
      ) {
        const r2Url = await optimizeAndUploadToR2(item.imageUrl, "uploads/migrated");
        if (r2Url && isDolcakeMediaUrl(r2Url)) {
          updatedImageUrl = r2Url;
          shouldUpdate = true;
        }
      }

      if (
        item.imageBUrl &&
        !isDolcakeMediaUrl(item.imageBUrl) &&
        (item.imageBUrl.startsWith("http://") || item.imageBUrl.startsWith("https://"))
      ) {
        const r2Url = await optimizeAndUploadToR2(item.imageBUrl, "uploads/migrated");
        if (r2Url && isDolcakeMediaUrl(r2Url)) {
          updatedImageBUrl = r2Url;
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        await prisma.matchWordItem.update({
          where: { id: item.id },
          data: {
            imageUrl: updatedImageUrl,
            imageBUrl: updatedImageBUrl,
          },
        });
      }
    }
  } catch (err: any) {
    console.warn(`[migrateTopicImagesInBackground] Error migrating topic ${topicId}:`, err?.message);
  }
}

