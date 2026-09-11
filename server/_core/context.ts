import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertClerkUser } from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  authProvider: "clerk" | "manus" | null;
};

async function authenticateWithClerk(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  if (!ENV.clerkSecretKey || !ENV.clerkPublishableKey) return null;
  try {
    const clerk = createClerkClient({
      secretKey: ENV.clerkSecretKey,
      publishableKey: ENV.clerkPublishableKey,
    });
    const authorization = req.headers.authorization;
    const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const token = bearerToken ?? cookies.__session;
    if (!token) return null;
    const claims = await verifyToken(token, {
      secretKey: ENV.clerkSecretKey,
      authorizedParties: ENV.clerkAuthorizedParties.length ? ENV.clerkAuthorizedParties : undefined,
    });
    const clerkUserId = typeof claims.sub === "string" ? claims.sub : null;
    if (!clerkUserId) return null;
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const metadata = clerkUser.publicMetadata as { role?: unknown };
    const role = metadata.role === "admin" ? "admin" : "user";
    return upsertClerkUser({ clerkUserId, name, email, role });
  } catch (error) {
    console.warn("[Clerk] Request authentication failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  if (ENV.clerkSecretKey && ENV.clerkPublishableKey) {
    const clerkUser = await authenticateWithClerk(opts.req);
    return { req: opts.req, res: opts.res, user: clerkUser, authProvider: clerkUser ? "clerk" : null };
  }

  try {
    const user = await sdk.authenticateRequest(opts.req);
    return { req: opts.req, res: opts.res, user, authProvider: user ? "manus" : null };
  } catch {
    return { req: opts.req, res: opts.res, user: null, authProvider: null };
  }
}
