import { test, expect } from "@playwright/test";

/**
 * Browser smoke test for the public purchase flow.
 * It deliberately stops after creating a pending order; no payment is attempted.
 * The test creates one disposable test order in the configured database.
 */
test("customer can add a product to the cart and create a pending order", async ({ page }) => {
  const testEmail = `e2e-${Date.now()}@example.test`;
  let createdOrderNumber: string | undefined;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Organic Holy Land" })).toBeVisible();

  const firstAvailableProduct = page.locator(".product-card:not(.is-out-of-stock)").first();
  await expect(firstAvailableProduct).toBeVisible();
  const productName = await firstAvailableProduct.locator("h3").innerText();
  await firstAvailableProduct.getByRole("button", { name: /أضف للسلة|متبقي/ }).click();

  await page.getByRole("button", { name: "فتح سلة المشتريات" }).click();
  const drawer = page.locator(".cart-drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText(productName);

  await drawer.getByLabel("الاسم الكامل").fill("Playwright Test Customer");
  await drawer.getByLabel("البريد الإلكتروني").fill(testEmail);
  await drawer.getByLabel("رقم الهاتف").fill("0790000000");
  await drawer.getByLabel("العنوان بالتفصيل").fill("عنوان اختبار Playwright، إربد");
  await drawer.getByLabel("المحافظة أو المدينة").selectOption("إربد");

  await expect(drawer.locator(".order-summary")).toBeVisible();
  await expect(drawer.locator(".order-summary")).toContainText("الشحن");

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/orders.create") && response.request().method() === "POST",
  );
  await drawer.locator("form.order-form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });

  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const result = payload?.[0]?.result?.data?.json ?? payload?.result?.data?.json;

  expect(result?.success).toBe(true);
  expect(result?.paymentStatus).toBe("pending");
  expect(result?.currency).toBe("JOD");
  expect(result?.orderNumber).toMatch(/^OHL-/);
  createdOrderNumber = result.orderNumber;

  await expect(page.getByRole("dialog", { name: /شكراً لثقتك بنا/ })).toBeVisible();
  await expect(page.getByText("بانتظار الدفع")).toBeVisible();
  await expect(page.getByText(createdOrderNumber)).toBeVisible();
});
