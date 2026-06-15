import { Router } from "express";
import { db } from "@workspace/db";
import { marketTokensTable, newsArticlesTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";

const router = Router();

router.get("/overview", async (_req, res) => {
  res.json({
    totalMarketCapUsd: 2_320_000_000_000,
    btcDominancePct: 56.1,
    ethDominancePct: 9.9,
    volume24hUsd: 105_670_000_000,
    change24hPct: -0.8,
    fearGreedIndex: 11,
    fearGreedLabel: "Extreme Fear",
  });
});

router.get("/trending", async (_req, res) => {
  const tokens = await db.select().from(marketTokensTable)
    .where(eq(marketTokensTable.isTrending, 1))
    .orderBy(asc(marketTokensTable.rank))
    .limit(20);
  res.json(tokens);
});

router.get("/gainers", async (_req, res) => {
  const all = await db.select().from(marketTokensTable).orderBy(desc(marketTokensTable.change24h)).limit(20);
  res.json(all.filter(t => t.change24h > 0));
});

router.get("/losers", async (_req, res) => {
  const all = await db.select().from(marketTokensTable).orderBy(asc(marketTokensTable.change24h)).limit(20);
  res.json(all.filter(t => t.change24h < 0));
});

router.get("/news", async (_req, res) => {
  const articles = await db.select().from(newsArticlesTable).orderBy(desc(newsArticlesTable.id)).limit(20);
  res.json(articles);
});

export default router;
