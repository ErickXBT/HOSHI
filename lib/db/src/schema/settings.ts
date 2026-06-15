import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull().default("USD"),
  language: text("language").notNull().default("en"),
  theme: text("theme").notNull().default("dark"),
  hideBalances: boolean("hide_balances").notNull().default(false),
  biometricsEnabled: boolean("biometrics_enabled").notNull().default(false),
  autoLockMinutes: integer("auto_lock_minutes").notNull().default(5),
  notifyPriceAlerts: boolean("notify_price_alerts").notNull().default(true),
  notifyTransactions: boolean("notify_transactions").notNull().default(true),
  notifySecurity: boolean("notify_security").notNull().default(true),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
