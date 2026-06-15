import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: text("type").notNull(), // send | receive | swap | buy | sell
  tokenSymbol: text("token_symbol").notNull(),
  tokenLogoUrl: text("token_logo_url"),
  amount: real("amount").notNull(),
  amountUsd: real("amount_usd").notNull(),
  chain: text("chain").notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("confirmed"), // pending | confirmed | failed
  gasUsd: real("gas_usd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
