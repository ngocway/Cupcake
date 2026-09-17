"use client";

import { useState, useCallback } from "react";
import { toBlob } from "html-to-image";
import { uploadImageFast } from "@/lib/direct-upload";

export function useGameThumbnailCapture() {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureThumbnail = useCallback(
    async (element: HTMLElement | null): Promise<string | null> => {
      if (!element) {
        console.warn("[ThumbnailCapture] No preview element reference found.");
        return null;
      }

      setIsCapturing(true);
      try {
        // Small delay to ensure all images in the preview DOM are fully rendered
        await new Promise((resolve) => setTimeout(resolve, 150));

        const blob = await toBlob(element, {
          quality: 0.85,
          pixelRatio: 1.0,
          cacheBust: false,
          skipFonts: true,
          fontEmbedCSS: "",
        }).catch((e) => {
          console.warn("[ThumbnailCapture] html-to-image skipped:", e);
          return null;
        });

        if (!blob) {
          return null;
        }

        // Upload to cloud storage via uploadImageFast
        const uploadedUrl = await uploadImageFast(blob, {
          maxWidth: 1280,
          maxHeight: 720,
          quality: 0.85,
        }).catch((e) => {
          console.warn("[ThumbnailCapture] uploadImageFast skipped:", e);
          return null;
        });

        return uploadedUrl || null;
      } catch (err) {
        console.warn("[ThumbnailCapture] Thumbnail generation bypassed:", err);
        return null;
      } finally {
        setIsCapturing(false);
      }
    },
    []
  );

  return {
    captureThumbnail,
    isCapturing,
  };
}
