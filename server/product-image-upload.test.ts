import { describe, expect, it } from "vitest";
import { makeProductImageKey, PRODUCT_IMAGE_MAX_BYTES, validateProductImage } from "./product-image-upload";

describe("product image upload validation", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (mimetype) => {
    expect(validateProductImage({ mimetype, size: 1024, originalname: "olive oil.png" }).ok).toBe(true);
  });

  it.each(["image/svg+xml", "application/pdf", "application/javascript"])("rejects %s", (mimetype) => {
    const result = validateProductImage({ mimetype, size: 1024, originalname: "file" });
    expect(result.ok).toBe(false);
  });

  it("rejects files over 5 MB", () => {
    const result = validateProductImage({ mimetype: "image/jpeg", size: PRODUCT_IMAGE_MAX_BYTES + 1, originalname: "large.jpg" });
    expect(result.ok).toBe(false);
  });

  it("creates a safe namespaced storage key", () => {
    const key = makeProductImageKey(42, "زيت زيتون ../../unsafe.png", "image/png");
    expect(key).toMatch(/^product-images\/admin-42\/\d+-.*\.png$/);
    expect(key).not.toContain("..");
    expect(key).not.toContain("//");
  });
});
