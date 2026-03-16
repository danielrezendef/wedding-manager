import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { webcrypto } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAgendamento,
  createCobranca,
  createContrato,
  createUser,
  createUserFromSocial,
  deleteAgendamento,
  deleteContrato,
  getLatestContratoByUserId,
  deleteUser,
  getAgendamentoById,
  getCobrancaByAgendamentoId,
  getDashboardStats,
  getContratoById,
  getUserByEmail,
  getUserById,
  listAgendamentos,
  listContratos,
  listUsers,
  updateAgendamento,
  updateCobranca,
  updateContrato,
  updateUserRole,
  updateUserProfile,
  updateUserProfilePhoto,
} from "./db";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { OAuth2Client } from "google-auth-library";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

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

  generateProfilePhotoUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        contentType: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const fileKey = `profile-photos/${ctx.user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { url } = await storagePut(fileKey, "", input.contentType);
        return { success: true, uploadUrl: url, fileKey };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar URL de upload" });
      }
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

  // ─── Google OAuth ────────────────────────────────────────────────────────
  googleLogin: publicProcedure
    .input(
      z.object({
        credential: z.string().min(1, "Token Google obrigatório"),
        clientId: z.string().min(1, "Client ID obrigatório"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const client = new OAuth2Client(input.clientId);
        const ticket = await client.verifyIdToken({
          idToken: input.credential,
          audience: input.clientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Token Google inválido." });
        }

        const { email, name, picture } = payload;

        // Verifica se usuário já existe
        let user = await getUserByEmail(email);
        if (!user) {
          // Cria novo usuário com dados do Google
          user = await createUserFromSocial({
            name: name || email.split("@")[0],
            email,
            profilePhoto: picture || undefined,
            loginMethod: "google",
          });
        } else {
          // Atualiza foto se não tiver uma
          if (!user.profilePhoto && picture) {
            await updateUserProfilePhoto(user.id, picture);
          }
        }

        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const token = await signToken({ userId: user.id, email: user.email!, role: user.role });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, profilePhoto: user.profilePhoto },
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error("Google login error:", error);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Falha na autenticação com Google." });
      }
    }),

});

// ─── Agendamentos Router ──────────────────────────────────────────────────────
const agendamentosRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["orcamento", "confirmado", "pagamento", "concluido"]).optional(),
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
        status: z.enum(["orcamento", "confirmado", "pagamento", "concluido"]).optional(),
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
        status: z.enum(["orcamento", "confirmado", "pagamento", "concluido"]),
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

// ─── Contratos Router ──────────────────────────────────────────────────────────
const contratosRouter = router({
  get: protectedProcedure
    .query(async ({ ctx }) => {
      const contrato = await getLatestContratoByUserId(ctx.user.id);
      return contrato ?? null;
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await listContratos(ctx.user.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        nomeCompleto: z.string().min(1, "Nome completo obrigatório"),
        cpf: z.string().min(1, "CPF obrigatório"),
        enderecoCompleto: z.string().min(1, "Endereço obrigatório"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createContrato({
        userId: ctx.user.id,
        nomeCompleto: input.nomeCompleto,
        cpf: input.cpf,
        enderecoCompleto: input.enderecoCompleto,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        cpf: z.string().optional(),
        enderecoCompleto: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contrato = await getContratoById(input.id);
      if (!contrato) throw new Error("Contrato não encontrado");
      if (contrato.userId !== ctx.user.id) throw new Error("Não autorizado");

      return await updateContrato(input.id, {
        nomeCompleto: input.nomeCompleto ?? contrato.nomeCompleto,
        cpf: input.cpf ?? contrato.cpf,
        enderecoCompleto: input.enderecoCompleto ?? contrato.enderecoCompleto,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const contrato = await getContratoById(input.id);
      if (!contrato) throw new Error("Contrato não encontrado");
      if (contrato.userId !== ctx.user.id) throw new Error("Não autorizado");
      
      await deleteContrato(input.id);
      return { success: true };
    })
});



// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  agendamentos: agendamentosRouter,
  cobrancas: cobrancasRouter,
  contratos: contratosRouter,

  dashboard: dashboardRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
