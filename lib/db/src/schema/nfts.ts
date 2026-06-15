import { pgTable, serial, text, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nftsTable = pgTable("nfts", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  name: text("name").notNull(),
  collection: text("collection").notNull(),
  chain: text("chain").notNull(),
  imageUrl: text("image_url"),
  tokenId: text("token_id").notNull(),
  contractAddress: text("contract_address"),
  floorPriceUsd: real("floor_price_usd"),
  description: text("description"),
});

export const insertNftSchema = createInsertSchema(nftsTable).omit({ id: true });
export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nftsTable.$inferSelect;
