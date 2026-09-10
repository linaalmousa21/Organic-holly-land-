import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const homePath = fileURLToPath(new URL("../client/src/pages/Home.tsx", import.meta.url));
const cssPath = fileURLToPath(new URL("../client/src/index.css", import.meta.url));

const homeSource = readFileSync(homePath, "utf8");
const cssSource = readFileSync(cssPath, "utf8");

describe("Organic Holy Land storefront preview", () => {
  it("contains the Arabic storefront sections and core shopping interactions", () => {
    expect(homeSource).toContain("عضوي الأرض المقدسة");
    expect(homeSource).toContain("HOLY LAND ORGANIC");
    expect(homeSource).toContain("Organic Holy Land");
    expect(homeSource).toContain("زيت الزيتون");
    expect(homeSource).toContain("العسل");
    expect(homeSource).toContain("الزعتر");
    expect(homeSource).toContain("الألبان");
    expect(homeSource).toContain("featuredCategories");
    expect(homeSource).toContain("مؤونة تُفرح");
    expect(homeSource).toContain("قصتنا");
    expect(homeSource).toContain("setCartOpen");
    expect(homeSource).toContain("أضف للسلة");
  });

  it("keeps the requested green/lime identity and mobile layout", () => {
    expect(cssSource).toContain("#183c2e");
    expect(cssSource).toContain("#c9f23d");
    expect(cssSource).toContain("@media (max-width: 680px)");
    expect(cssSource).toContain("font-family: 'Cairo'");
  });

  it("references uploaded preview imagery instead of bundling local media", () => {
    expect(homeSource).toContain("/manus-storage/hero-table_f2893f80.jpg");
    expect(homeSource).toContain("/manus-storage/grape-leaves_a282bafc.jpg");
    expect(homeSource).toContain("/manus-storage/olive-oil_368c793e.jpg");
  });
});
