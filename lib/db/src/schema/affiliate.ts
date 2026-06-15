import { pgTable, serial, text, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const affiliateTable = pgTable("affiliate", {
  id: serial("id").primaryKey(),
  referralCode: text("referral_code").notNull().unique(),
  referralLink: text("referral_link").notNull(),
  totalReferrals: integer("total_referrals").notNull().default(0),
  volumeSwapUsd: real("volume_swap_usd").notNull().default(0),
  commissionUsd: real("commission_usd").notNull().default(0),
  tokensEarned: real("tokens_earned").notNull().default(0),
  tokensClaimed: real("tokens_claimed").notNull().default(0),
});

export const insertAffiliateSchema = createInsertSchema(affiliateTable).omit({ id: true });
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliateTable.$inferSelect;
