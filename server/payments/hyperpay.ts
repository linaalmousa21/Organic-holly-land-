export type HyperPayConfig = {
  baseUrl: string;
  entityId: string;
  accessToken: string;
  currency?: string;
  paymentType?: string;
};

export type HyperPayPaymentResponse = {
  id?: string;
  paymentType?: string;
  amount?: string;
  currency?: string;
  result?: {
    code?: string;
    description?: string;
  };
  [key: string]: unknown;
};

export type HyperPayExpectedPayment = {
  amount: number;
  currency: string;
  paymentType?: string;
};

type FetchLike = typeof fetch;

function endpoint(config: HyperPayConfig, path: string) {
  return `${config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function authHeaders(config: HyperPayConfig) {
  return {
    Authorization: `Bearer ${config.accessToken}`,
    Accept: "application/json",
  };
}

/** Creates a COPYandPAY checkout using server-side credentials. */
export async function prepareHyperPayCheckout(
  config: HyperPayConfig,
  input: { amount: number; currency?: string; paymentType?: string },
  fetchImpl: FetchLike = fetch,
) {
  if (!config.entityId || !config.accessToken) {
    throw new Error("HyperPay credentials are not configured");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("HyperPay amount must be positive");
  }

  const body = new URLSearchParams({
    entityId: config.entityId,
    amount: input.amount.toFixed(2),
    currency: input.currency ?? config.currency ?? "JOD",
    paymentType: input.paymentType ?? config.paymentType ?? "DB",
    integrity: "true",
  });

  const response = await fetchImpl(endpoint(config, "/v1/checkouts"), {
    method: "POST",
    headers: {
      ...authHeaders(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as { id?: string; integrity?: string; result?: unknown };
  if (!response.ok || !data.id) {
    throw new Error("HyperPay checkout preparation failed");
  }

  return { checkoutId: data.id, integrity: data.integrity ?? null };
}

/** Retrieves a payment result and verifies it against the server-calculated order total. */
export async function verifyHyperPayPayment(
  config: HyperPayConfig,
  resourcePath: string,
  expected: HyperPayExpectedPayment,
  fetchImpl: FetchLike = fetch,
) {
  if (!resourcePath || !resourcePath.startsWith("/v1/") || resourcePath.includes("://")) {
    throw new Error("Invalid HyperPay resource path");
  }

  const separator = resourcePath.includes("?") ? "&" : "?";
  const url = `${endpoint(config, resourcePath)}${separator}entityId=${encodeURIComponent(config.entityId)}`;
  const response = await fetchImpl(url, {
    method: "GET",
    headers: authHeaders(config),
  });
  const data = (await response.json()) as HyperPayPaymentResponse;

  const resultCode = data.result?.code ?? "";
  const amountMatches = Number(data.amount).toFixed(2) === expected.amount.toFixed(2);
  const currencyMatches = data.currency === expected.currency;
  const paymentTypeMatches = !expected.paymentType || data.paymentType === expected.paymentType;
  const successful = /^000\.(000|100)\./.test(resultCode);

  return {
    successful: response.ok && successful && amountMatches && currencyMatches && paymentTypeMatches,
    resultCode,
    resultDescription: data.result?.description ?? "",
    amountMatches,
    currencyMatches,
    paymentTypeMatches,
    response: data,
  };
}
