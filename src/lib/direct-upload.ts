import { compressImageFile, CompressionOptions } from "./image-compressor";
import { uploadMedia } from "@/actions/upload-actions";

/**
 * Uploads an image file to R2 in record speed by:
 * 1. Compressing & resizing image to WebP client-side (~90-95% size reduction).
 * 2. Uploading via fast API route endpoint (or Server Action fallback).
 */
export async function uploadImageFast(
  file: File | Blob,
  options?: CompressionOptions
): Promise<string> {
  try {
    // 1. Client-side Compression
    const compressedFile = await compressImageFile(file, options);

    // 2. Fast API Upload
    const formData = new FormData();
    formData.append("file", compressedFile);

    const res = await fetch("/api/upload/fast", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }

    // Fallback: Use server action uploadMedia if API endpoint is unreachable
    const fallbackRes = await uploadMedia(formData);
    if (fallbackRes.success && fallbackRes.url) {
      return fallbackRes.url;
    }

    throw new Error(fallbackRes.error || "Tải hình ảnh thất bại!");
  } catch (error: any) {
    console.error("uploadImageFast failed:", error);
    throw error;
  }
}

/**
 * Takes an external image URL (or array of candidate URLs, or data URI),
 * sends them to /api/upload/url-fast to download and compress the first working one
 * to WebP (600x600, ~20-50KB) via Sharp, and store in Cloudflare R2 CDN.
 * 
 * Returns the optimized media.dolcake.com URL, or original URL if already hosted or failed.
 */
export async function uploadExternalImageUrlFast(
  urlOrUrls: string | string[] | null | undefined
): Promise<string> {
  if (!urlOrUrls) return "";

  if (Array.isArray(urlOrUrls)) {
    const list = urlOrUrls.filter((u): u is string => typeof u === "string" && Boolean(u.trim()));
    if (list.length === 0) return "";

    // If the first candidate is already on R2, return it immediately
    const alreadyR2 = list.find(
      (u) =>
        u.includes("media.dolcake.com") ||
        u.includes("r2.dev") ||
        u.includes("r2.cloudflarestorage.com")
    );
    if (alreadyR2) return alreadyR2;

    try {
      const res = await fetch("/api/upload/url-fast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: list }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          return data.url;
        }
      }
    } catch (err) {
      console.warn("[uploadExternalImageUrlFast] API request failed:", err);
    }
    return list[0];
  }

  const clean = urlOrUrls.trim();

  // Already on Dolcake CDN / R2
  if (
    clean.includes("media.dolcake.com") ||
    clean.includes("r2.dev") ||
    clean.includes("r2.cloudflarestorage.com")
  ) {
    return clean;
  }

  // Not a web URL or data URI
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("data:")) {
    return clean;
  }

  try {
    const res = await fetch("/api/upload/url-fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: clean }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn("[uploadExternalImageUrlFast] API request failed:", err);
  }

  return clean;
}
