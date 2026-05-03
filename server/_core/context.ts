import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { getUserById } from "../db";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// IMPORTANTE:
// Precisa ser exatamente a mesma chave usada em server/routers.ts para assinar o login.
// Antes estava "Sgaapp-key" aqui e "wedding-secret-key" no login; quando JWT_SECRET
// não existia no ambiente, o token do usuário não validava e o sistema podia cair no
// fallback de autenticação externa, fazendo ações aparecerem no usuário admin.
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "wedding-secret-key");

async function authenticateCustomJwt(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = Number(payload["userId"]);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    const user = await getUserById(userId);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await authenticateCustomJwt(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
