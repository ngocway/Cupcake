/**
 * Client-side Image Compression Utility
 * Resizes and converts images to WebP format in the browser before upload.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.82,
    mimeType = "image/webp"
  } = options;

  // If file is SVG or non-image, skip compression
  if (file.type === "image/svg+xml" || (file instanceof File && !file.type.startsWith("image/"))) {
    if (file instanceof File) return file;
    return new File([file], "image.svg", { type: "image/svg+xml" });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("File không phải hình ảnh hợp lệ"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scale
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const scale = Math.min(widthRatio, heightRatio);

          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context không khả dụng"));
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Nén ảnh thất bại"));
              return;
            }

            const originalName = file instanceof File ? file.name : "image.jpg";
            const baseName = originalName.replace(/\.[^/.]+$/, "");
            const ext = mimeType === "image/webp" ? ".webp" : ".jpg";
            const fileName = `${baseName}${ext}`;

            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
