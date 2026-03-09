import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "wedding-secret-key");
const COOKIE_NAME = "app_session_id";

async function authenticateCustomJwt(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    // Try custom JWT first (userId, email, role)
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = payload["userId"] as number | undefined;
      if (userId) {
        const user = await getUserById(userId);
        return user ?? null;
      }
    } catch {
      // Not a custom JWT, fall through to Manus OAuth
    }

    return null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Try custom JWT auth first
  user = await authenticateCustomJwt(opts.req);

  // Fall back to Manus OAuth if no custom JWT
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
