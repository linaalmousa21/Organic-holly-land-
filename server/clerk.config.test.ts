import { describe, expect, it } from "vitest";
import { createClerkClient } from "@clerk/backend";

describe("Clerk configuration", () => {
  it("authenticates the configured Clerk Test secret without exposing it", async () => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
    expect(secretKey, "CLERK_SECRET_KEY is required").toBeTruthy();
    expect(publishableKey, "VITE_CLERK_PUBLISHABLE_KEY is required").toMatch(/^pk_(test|live)_/);
    const clerk = createClerkClient({ secretKey, publishableKey });
    const result = await clerk.users.getUserList({ limit: 1 });
    expect(Array.isArray(result.data)).toBe(true);
  }, 20_000);
});
