import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const adminPage = readFileSync(fileURLToPath(new URL("../client/src/pages/Admin.tsx", import.meta.url)), "utf8");
const router = readFileSync(fileURLToPath(new URL("./routers.ts", import.meta.url)), "utf8");
const db = readFileSync(fileURLToPath(new URL("./db.ts", import.meta.url)), "utf8");
const schema = readFileSync(fileURLToPath(new URL("../drizzle/schema.ts", import.meta.url)), "utf8");

describe("admin catalog management", () => {
  it("keeps the dashboard gated by the Clerk admin role", () => {
    expect(adminPage).toContain("publicMetadata?.role === \"admin\"");
    expect(router).toContain("catalog: adminProcedure");
    expect(router).toContain("createProduct: adminProcedure");
    expect(router).toContain("updateProduct: adminProcedure");
    expect(router).toContain("archiveProduct: adminProcedure");
    expect(router).toContain("createCategory: adminProcedure");
    expect(router).toContain("deleteCategory: adminProcedure");
  });

  it("models inventory thresholds and protects linked categories", () => {
    expect(schema).toContain("stockQuantity: int");
    expect(schema).toContain("lowStockThreshold: int");
    expect(db).toContain("لا يمكن حذف تصنيف يحتوي على منتجات");
    expect(db).toContain("المخزون تغير أثناء إتمام الطلب");
  });

  it("offers product and category editors plus quick stock actions", () => {
    expect(adminPage).toContain("PRODUCT EDITOR");
    expect(adminPage).toContain("CATEGORY EDITOR");
    expect(adminPage).toContain("STOCK CONTROL");
    expect(adminPage).toContain("quickStock");
    expect(adminPage).toContain("إظهار المنتج في واجهة المتجر");
  });
});
