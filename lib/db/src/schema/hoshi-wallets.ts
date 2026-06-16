import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const hoshiWalletsTable = pgTable("hoshi_wallets", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  walletId: text("wallet_id").notNull().unique(),
  name: text("name").notNull(),
  evmAddress: text("evm_address").notNull(),
  solAddress: text("sol_address").notNull(),
  encrypted: text("encrypted").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
