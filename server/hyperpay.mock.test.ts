import { describe, expect, it, vi } from "vitest";
import { prepareHyperPayCheckout, verifyHyperPayPayment, type HyperPayConfig } from "./payments/hyperpay";

const config: HyperPayConfig = {
  baseUrl: "https://eu-test.oppwa.com/",
  entityId: "test-entity-id",
  accessToken: "test-access-token",
  currency: "JOD",
  paymentType: "DB",
};

function jsonResponse(body: unknown, ok = true) {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HyperPay mock integration", () => {
  it("prepares a COPYandPAY checkout without sending card data", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ id: "mock-checkout-123", integrity: "mock-integrity" }),
    );

    const result = await prepareHyperPayCheckout(config, { amount: 14, currency: "JOD", paymentType: "DB" }, fetchMock);

    expect(result).toEqual({ checkoutId: "mock-checkout-123", integrity: "mock-integrity" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://eu-test.oppwa.com/v1/checkouts");
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer test-access-token",
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const body = String(request?.body);
    expect(body).toContain("entityId=test-entity-id");
    expect(body).toContain("amount=14.00");
    expect(body).toContain("currency=JOD");
    expect(body).not.toMatch(/card|cvv|number|expiry/i);
  });

  it("accepts a successful payment only when the result, amount, and currency match", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "payment-123",
        paymentType: "DB",
        amount: "14.00",
        currency: "JOD",
        result: { code: "000.100.110", description: "Request successfully processed" },
      }),
    );

    const result = await verifyHyperPayPayment(
      config,
      "/v1/checkouts/mock-checkout-123/payment",
      { amount: 14, currency: "JOD", paymentType: "DB" },
      fetchMock,
    );

    expect(result.successful).toBe(true);
    expect(result.amountMatches).toBe(true);
    expect(result.currencyMatches).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://eu-test.oppwa.com/v1/checkouts/mock-checkout-123/payment?entityId=test-entity-id",
    );
  });

  it("rejects a declined payment", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "payment-declined",
        paymentType: "DB",
        amount: "14.00",
        currency: "JOD",
        result: { code: "800.100.153", description: "Transaction declined" },
      }),
    );

    const result = await verifyHyperPayPayment(
      config,
      "/v1/checkouts/mock-checkout-declined/payment",
      { amount: 14, currency: "JOD", paymentType: "DB" },
      fetchMock,
    );

    expect(result.successful).toBe(false);
    expect(result.resultCode).toBe("800.100.153");
  });

  it("rejects a response with a tampered amount even if the provider reports success", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "payment-tampered",
        paymentType: "DB",
        amount: "1.00",
        currency: "JOD",
        result: { code: "000.000.000", description: "Success" },
      }),
    );

    const result = await verifyHyperPayPayment(
      config,
      "/v1/checkouts/mock-checkout-tampered/payment",
      { amount: 14, currency: "JOD", paymentType: "DB" },
      fetchMock,
    );

    expect(result.successful).toBe(false);
    expect(result.amountMatches).toBe(false);
    expect(result.currencyMatches).toBe(true);
  });

  it("rejects an unsafe resource path instead of allowing an arbitrary outbound request", async () => {
    const fetchMock = vi.fn<typeof fetch>();

    await expect(
      verifyHyperPayPayment(config, "https://attacker.example/payment", { amount: 14, currency: "JOD" }, fetchMock),
    ).rejects.toThrow("Invalid HyperPay resource path");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
