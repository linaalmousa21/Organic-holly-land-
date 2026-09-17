import { describe, expect, it } from "vitest";
import { makeProductMediaKey, PRODUCT_VIDEO_MAX_BYTES, validateProductVideo } from "./product-media-upload";

describe("Product video upload validation", () => {
  it("accepts supported short-video formats within the size limit", () => {
    expect(validateProductVideo({ mimetype: "video/mp4", size: 1024, originalname: "olive-oil.mp4" }).ok).toBe(true);
    expect(validateProductVideo({ mimetype: "video/webm", size: 1024, originalname: "honey.webm" }).ok).toBe(true);
  });

  it("rejects unsupported formats and oversized files", () => {
    expect(validateProductVideo({ mimetype: "video/avi", size: 1024 }).ok).toBe(false);
    expect(validateProductVideo({ mimetype: "video/mp4", size: PRODUCT_VIDEO_MAX_BYTES + 1 }).ok).toBe(false);
    expect(validateProductVideo({ mimetype: "video/mp4", size: 0 }).ok).toBe(false);
  });

  it("creates a safe storage key with a video extension", () => {
    const key = makeProductMediaKey(42, "../../olive oil demo!.mp4", "video/mp4");
    expect(key).toMatch(/^product-media\/admin-42\/\d+-olive-oil-demo\.mp4$/);
    expect(key).not.toContain("..");
  });
});
