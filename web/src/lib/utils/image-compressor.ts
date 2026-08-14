/**
 * Client-Side Smart Image Compressor
 * Resizes ultra-heavy 4K/DSLR images to web-optimized dimensions (max 2560px)
 * and compresses to high-fidelity WebP format with real-time compression metrics.
 */

export interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface CompressionResult {
  file: File;
  metrics: CompressionMetrics;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
  } = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 0.85,
    mimeType = "image/webp",
  } = options;

  // If already small (< 300KB) and web-formatted, skip re-compression
  if (file.size < 300 * 1024 && (file.type === "image/webp" || file.type === "image/jpeg")) {
    return {
      file,
      metrics: {
        originalSize: file.size,
        compressedSize: file.size,
        savedBytes: 0,
        savedPercentage: 0,
        width: 0,
        height: 0,
        mimeType: file.type,
      },
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          file,
          metrics: {
            originalSize: file.size,
            compressedSize: file.size,
            savedBytes: 0,
            savedPercentage: 0,
            width,
            height,
            mimeType: file.type,
          },
        });
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP (or fallback to JPEG if browser doesn't support WebP export)
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't reduce size, keep original
            resolve({
              file,
              metrics: {
                originalSize: file.size,
                compressedSize: file.size,
                savedBytes: 0,
                savedPercentage: 0,
                width,
                height,
                mimeType: file.type,
              },
            });
            return;
          }

          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const extension = mimeType === "image/webp" ? "webp" : "jpg";
          const newFileName = `${originalName}.${extension}`;

          const compressedFile = new File([blob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const savedBytes = Math.max(0, file.size - blob.size);
          const savedPercentage = Math.round((savedBytes / file.size) * 100);

          resolve({
            file: compressedFile,
            metrics: {
              originalSize: file.size,
              compressedSize: blob.size,
              savedBytes,
              savedPercentage,
              width,
              height,
              mimeType,
            },
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: return original file on decode error
      resolve({
        file,
        metrics: {
          originalSize: file.size,
          compressedSize: file.size,
          savedBytes: 0,
          savedPercentage: 0,
          width: 0,
          height: 0,
          mimeType: file.type,
        },
      });
    };

    img.src = objectUrl;
  });
}
