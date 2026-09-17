import path from "node:path";

export const PRODUCT_VIDEO_MAX_BYTES = 20 * 1024 * 1024;
export const PRODUCT_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function validateProductVideo(file: { mimetype?: string; size?: number; originalname?: string }) {
  if (!file.mimetype || !PRODUCT_VIDEO_MIME_TYPES.has(file.mimetype)) {
    return { ok: false as const, message: "Only MP4, WebM, and MOV videos are allowed" };
  }
  if (!file.size || file.size <= 0 || file.size > PRODUCT_VIDEO_MAX_BYTES) {
    return { ok: false as const, message: "Video must be between 1 byte and 20 MB" };
  }
  return { ok: true as const };
}

export function makeProductMediaKey(adminUserId: number, originalName: string, mimetype: string) {
  const extension = mimetype === "video/webm" ? ".webm" : mimetype === "video/quicktime" ? ".mov" : ".mp4";
  const safeBase = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product-video";
  return `product-media/admin-${adminUserId}/${Date.now()}-${safeBase}${extension}`;
}
