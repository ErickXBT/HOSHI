import { pgTable, serial, text, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tokensTable = pgTable("tokens", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  chain: text("chain").notNull(),
  logoUrl: text("logo_url"),
  balance: real("balance").notNull().default(0),
  balanceUsd: real("balance_usd").notNull().default(0),
  priceUsd: real("price_usd").notNull().default(0),
  change24h: real("change24h").notNull().default(0),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isEnabled: boolean("is_enabled").notNull().default(true),
  contractAddress: text("contract_address"),
});

export const insertTokenSchema = createInsertSchema(tokensTable).omit({ id: true });
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokensTable.$inferSelect;
