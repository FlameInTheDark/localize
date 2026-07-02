/**
 * Image handling helpers shared by the Image and OCR panels.
 */

/** Accept attribute for image file inputs. */
export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp";

/** 20 MB safety cap for image uploads. */
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE) {
    return `Image is too large (${formatBytes(file.size)}). Maximum is ${formatBytes(MAX_IMAGE_SIZE)}.`;
  }
  // Tolerate both MIME and extension checks.
  const okType =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
  if (!okType) {
    return "Unsupported file type. Use PNG, JPEG, WebP, GIF, or BMP.";
  }
  return null;
}

/** Read a File into a base64 data URL (for <img> preview). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Convert a File to a raw base64 string (no data: prefix) for the API. */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

/** Format bytes into a human-readable string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Convert an ArrayBuffer to a base64 string (chunked to avoid call-stack limits). */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32 KB
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}
