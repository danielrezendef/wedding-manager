import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAgendamento,
  createCobranca,
  createUser,
  deleteAgendamento,
  deleteUser,
  getAgendamentoById,
  getCobrancaByAgendamentoId,
  getDashboardStats,
  getUserByEmail,
  getUserById,
  listAgendamentos,
  listUsers,
  updateAgendamento,
  updateCobranca,
  updateUserRole,
  updateUserProfile,
} from "./db";
import { ENV } from "./_core/env";

// ─── JWT helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "wedding-secret-key");

async function signToken(payload: { userId: number; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado." });

      const hash = await bcrypt.hash(input.password, 12);
      const user = await createUser({ name: input.name, email: input.email, password: hash });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const token = await signToken({ userId: user.id, email: user.email!, role: user.role });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(1, "Senha obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });

      const token = await signToken({ userId: user.id, email: user.email!, role: user.role });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        profilePhoto: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await updateUserProfile(ctx.user.id, input);
      const updated = await getUserById(ctx.user.id);
      return { success: true, user: updated };
    }),

  uploadProfilePhoto: protectedProcedure
    .input(
      z.object({
        photoUrl: z.string().url("URL da foto invalida"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await updateUserProfile(ctx.user.id, { profilePhoto: input.photoUrl });
      const updated = await getUserById(ctx.user.id);
      return { success: true, user: updated };
    }),
});

// ─── Agendamentos Router ──────────────────────────────────────────────────────
const agendamentosRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["orcamento", "confirmado", "cobranca", "concluido"]).optional(),
        nomeNoiva: z.string().optional(),
        nomeNoivo: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const filters = {
        ...(input ?? {}),
        userId: isAdmin ? undefined : ctx.user.id,
      };
      return listAgendamentos(filters);
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const ag = await getAgendamentoById(input.id);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && ag.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const cobranca = await getCobrancaByAgendamentoId(ag.id);
      return { ...ag, cobranca: cobranca ?? null };
    }),

  create: protectedProcedure
    .input(
      z.object({
        nomeNoiva: z.string().min(1, "Nome da noiva obrigatório"),
        nomeNoivo: z.string().min(1, "Nome do noivo obrigatório"),
        dataEvento: z.string().min(1, "Data do evento obrigatória"),
        horario: z.string().min(1, "Horário obrigatório"),
        enderecoCerimonia: z.string().min(1, "Endereço obrigatório"),
        valorServico: z.string().min(1, "Valor obrigatório"),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ag = await createAgendamento({
        ...input,
        dataEvento: new Date(input.dataEvento),
        userId: ctx.user.id,
      });
      return ag;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nomeNoiva: z.string().min(1).optional(),
        nomeNoivo: z.string().min(1).optional(),
        dataEvento: z.string().optional(),
        horario: z.string().optional(),
        enderecoCerimonia: z.string().optional(),
        valorServico: z.string().optional(),
        status: z.enum(["orcamento", "confirmado", "cobranca", "concluido"]).optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ag = await getAgendamentoById(input.id);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && ag.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, dataEvento, ...rest } = input;
      const updateData: Parameters<typeof updateAgendamento>[1] = { ...rest };
      if (dataEvento) updateData.dataEvento = new Date(dataEvento);
      return updateAgendamento(id, updateData);
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["orcamento", "confirmado", "cobranca", "concluido"]),
      })
    )
    .mutation(async ({ input }) => {
      const ag = await getAgendamentoById(input.id);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      return updateAgendamento(input.id, { status: input.status });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const ag = await getAgendamentoById(input.id);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteAgendamento(input.id);
      return { success: true };
    }),
});

// ─── Cobranças Router ─────────────────────────────────────────────────────────
const cobrancasRouter = router({
  byAgendamento: protectedProcedure
    .input(z.object({ agendamentoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const ag = await getAgendamentoById(input.agendamentoId);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && ag.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getCobrancaByAgendamentoId(input.agendamentoId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        agendamentoId: z.number(),
        nomeResponsavel: z.string().min(1, "Nome obrigatório"),
        cpf: z.string().min(11, "CPF inválido"),
        enderecoCompleto: z.string().min(1, "Endereço obrigatório"),
        valor: z.string().min(1, "Valor obrigatório"),
        condicaoPagamento: z.string().min(1, "Condição de pagamento obrigatória"),
        formaPagamento: z.enum(["pix", "dinheiro", "cartao_credito", "cartao_debito", "transferencia", "boleto"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ag = await getAgendamentoById(input.agendamentoId);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && ag.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const existing = await getCobrancaByAgendamentoId(input.agendamentoId);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Cobrança já cadastrada para este agendamento." });
      return createCobranca(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        agendamentoId: z.number(),
        nomeResponsavel: z.string().min(1).optional(),
        cpf: z.string().optional(),
        enderecoCompleto: z.string().optional(),
        valor: z.string().optional(),
        condicaoPagamento: z.string().optional(),
        formaPagamento: z.enum(["pix", "dinheiro", "cartao_credito", "cartao_debito", "transferencia", "boleto"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ag = await getAgendamentoById(input.agendamentoId);
      if (!ag) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && ag.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { agendamentoId, ...rest } = input;
      return updateCobranca(agendamentoId, rest);
    }),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.user.role === "admin";
    return getDashboardStats(isAdmin ? undefined : ctx.user.id);
  }),
});

// ─── Users Router (Admin only) ────────────────────────────────────────────────
const usersRouter = router({
  list: adminProcedure.query(() => listUsers()),

  updateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.userId);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  agendamentos: agendamentosRouter,
  cobrancas: cobrancasRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
