import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  time,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }), // bcrypt hash for custom auth
  loginMethod: varchar("loginMethod", { length: 64 }),
  profilePhoto: text("profilePhoto"), // URL da foto de perfil
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Agendamentos ─────────────────────────────────────────────────────────────
export const agendamentos = mysqlTable("agendamentos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  nomeNoiva: varchar("nomeNoiva", { length: 255 }).notNull(),
  nomeNoivo: varchar("nomeNoivo", { length: 255 }).notNull(),
  dataEvento: date("dataEvento").notNull(),
  horario: time("horario").notNull(),
  enderecoCerimonia: text("enderecoCerimonia").notNull(),
  valorServico: decimal("valorServico", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["orcamento", "confirmado", "pagamento", "concluido"])
    .default("orcamento")
    .notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agendamento = typeof agendamentos.$inferSelect;
export type InsertAgendamento = typeof agendamentos.$inferInsert;

// ─── Cobranças ────────────────────────────────────────────────────────────────
export const cobrancas = mysqlTable("cobrancas", {
  id: int("id").autoincrement().primaryKey(),
  agendamentoId: int("agendamentoId").notNull().unique(), // 1:1 com agendamento
  nomeResponsavel: varchar("nomeResponsavel", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  enderecoCompleto: text("enderecoCompleto").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  condicaoPagamento: varchar("condicaoPagamento", { length: 255 }).notNull(),
  formaPagamento: mysqlEnum("formaPagamento", [
    "pix",
    "dinheiro",
    "cartao_credito",
    "cartao_debito",
    "transferencia",
    "boleto",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cobranca = typeof cobrancas.$inferSelect;
export type InsertCobranca = typeof cobrancas.$inferInsert;
