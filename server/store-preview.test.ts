import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const homePath = fileURLToPath(new URL("../client/src/pages/Home.tsx", import.meta.url));
const cssPath = fileURLToPath(new URL("../client/src/index.css", import.meta.url));
const routerPath = fileURLToPath(new URL("./routers.ts", import.meta.url));
const migrationPath = fileURLToPath(new URL("../drizzle/catalog-seed.sql", import.meta.url));

const homeSource = readFileSync(homePath, "utf8");
const cssSource = readFileSync(cssPath, "utf8");
const routerSource = readFileSync(routerPath, "utf8");
const migrationSource = readFileSync(migrationPath, "utf8");

describe("Organic Holy Land storefront preview", () => {
  it("contains the Arabic storefront sections and dynamic shopping interactions", () => {
    expect(homeSource).toContain("عضوي الأرض المقدسة");
    expect(homeSource).toContain("HOLY LAND ORGANIC");
    expect(homeSource).toContain("Organic Holy Land");
    expect(homeSource).toContain("featuredCategories");
    expect(homeSource).toContain("catalogQuery");
    expect(homeSource).toContain("categoriesQuery");
    expect(homeSource).toContain("مؤونة تُفرح");
    expect(homeSource).toContain("قصتنا");
    expect(homeSource).toContain("setCartOpen");
    expect(homeSource).toContain("أضف للسلة");
  });

  it("exposes catalog and categories through public tRPC procedures", () => {
    expect(routerSource).toContain("catalog: router");
    expect(routerSource).toContain("list: publicProcedure");
    expect(routerSource).toContain("categories: publicProcedure");
  });

  it("keeps the requested green/lime identity and mobile layout", () => {
    expect(cssSource).toContain("#183c2e");
    expect(cssSource).toContain("#c9f23d");
    expect(cssSource).toContain("@media (max-width: 680px)");
    expect(cssSource).toContain("font-family: 'Cairo'");
  });

  it("seeds the uploaded preview imagery and current products into the catalog migration", () => {
    expect(migrationSource).toContain("/manus-storage/grape-leaves_a282bafc.jpg");
    expect(migrationSource).toContain("/manus-storage/olive-oil_368c793e.jpg");
    expect(migrationSource).toContain("/manus-storage/honey-preview_5a7b9acf.jpg");
    expect(migrationSource).toContain("/manus-storage/dish-preview_8a82762c.jpg");
    expect(migrationSource).toContain("/manus-storage/bread-preview_70405922.jpg");
  });
});
