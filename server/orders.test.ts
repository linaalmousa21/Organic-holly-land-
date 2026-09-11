import { describe, expect, it } from "vitest";
import { calculateOrder, calculateShipping } from "./db";

describe("order checkout calculations", () => {
  it("calculates a trusted server-side total from product ids", () => {
    const result = calculateOrder({
      name: "عميل تجريبي",
      email: "customer@example.com",
      phone: "0790000000",
      address: "شارع تجريبي 1",
      city: "إربد",
      items: [
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 1 },
      ],
    });

    expect(result.subtotal).toBe(27.5);
    expect(result.total).toBe(29.5);
    expect(result.items[0]).toMatchObject({ productName: "زيت زيتون بكر ممتاز", unitPrice: 12, lineTotal: 24 });
  });

  it("rejects unknown products and invalid quantities", () => {
    expect(() => calculateOrder({
      name: "عميل تجريبي", email: "customer@example.com", phone: "0790000000",
      address: "شارع تجريبي 1", city: "إربد", items: [{ productId: 999, quantity: 1 }],
    })).toThrow("Unknown product");
    expect(() => calculateOrder({
      name: "عميل تجريبي", email: "customer@example.com", phone: "0790000000",
      address: "شارع تجريبي 1", city: "إربد", items: [{ productId: 1, quantity: 0 }],
    })).toThrow("Quantity must be between 1 and 99");
  });

  it("uses the city delivery table and a fallback for other cities", () => {
    expect(calculateShipping("إربد")).toEqual({ city: "إربد", fee: 2, label: "إربد" });
    expect(calculateShipping("مادبا")).toEqual({ city: "مادبا", fee: 3, label: "باقي المحافظات" });
    expect(calculateOrder({
      name: "عميل تجريبي", email: "customer@example.com", phone: "0790000000",
      address: "شارع تجريبي 1", city: "العقبة", items: [{ productId: 1, quantity: 1 }],
    })).toMatchObject({ subtotal: 12, shippingFee: 4, total: 16 });
  });
});
