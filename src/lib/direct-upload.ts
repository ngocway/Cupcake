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
