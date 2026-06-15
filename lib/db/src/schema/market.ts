import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketTokensTable = pgTable("market_tokens", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  chain: text("chain").notNull(),
  logoUrl: text("logo_url"),
  priceUsd: real("price_usd").notNull().default(0),
  change24h: real("change24h").notNull().default(0),
  volume24hUsd: real("volume24h_usd").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  contractAddress: text("contract_address"),
  isTrending: integer("is_trending").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const newsArticlesTable = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  publishedAt: text("published_at").notNull(),
  sentiment: text("sentiment").notNull().default("neutral"),
  imageUrl: text("image_url"),
  url: text("url").notNull(),
  summary: text("summary"),
});

export const insertMarketTokenSchema = createInsertSchema(marketTokensTable).omit({ id: true, updatedAt: true });
export const insertNewsArticleSchema = createInsertSchema(newsArticlesTable).omit({ id: true });
export type InsertMarketToken = z.infer<typeof insertMarketTokenSchema>;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type MarketToken = typeof marketTokensTable.$inferSelect;
export type NewsArticle = typeof newsArticlesTable.$inferSelect;
