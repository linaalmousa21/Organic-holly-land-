import path from "node:path";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function validateProductImage(file: { mimetype?: string; size?: number; originalname?: string }) {
  if (!file.mimetype || !PRODUCT_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return { ok: false as const, message: "Only JPEG, PNG, and WebP images are allowed" };
  }
  if (!file.size || file.size <= 0 || file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return { ok: false as const, message: "Image must be between 1 byte and 5 MB" };
  }
  return { ok: true as const };
}

export function makeProductImageKey(adminUserId: number, originalName: string, mimetype: string) {
  const extension = extensionByMime[mimetype] ?? path.extname(originalName).toLowerCase() ?? ".bin";
  const safeBase = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product-image";
  return `product-images/admin-${adminUserId}/${Date.now()}-${safeBase}${extension}`;
}
