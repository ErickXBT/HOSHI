import { Router } from "express";
import { db } from "@workspace/db";
import { tokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListTokensParams, ToggleTokenParams } from "@workspace/api-zod";

const router = Router();

router.get("/:walletId", async (req, res) => {
  const { walletId } = ListTokensParams.parse({ walletId: Number(req.params.walletId) });
  const tokens = await db.select().from(tokensTable).where(eq(tokensTable.walletId, walletId));
  res.json(tokens);
});

router.get("/discover/all", async (req, res) => {
  const knownTokens = [
    { symbol: "USDT", name: "Tether", chain: "ETH", priceUsd: 1.00, rank: 3, contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7" },
    { symbol: "USDC", name: "USD Coin", chain: "ETH", priceUsd: 1.00, rank: 6, contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    { symbol: "DAI", name: "Dai", chain: "ETH", priceUsd: 1.00, rank: 24, contractAddress: "0x6b175474e89094c44da98b954eedeac495271d0f" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", chain: "ETH", priceUsd: 67000, rank: 16, contractAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" },
    { symbol: "LINK", name: "Chainlink", chain: "ETH", priceUsd: 14.25, rank: 18, contractAddress: "0x514910771af9ca656af840dff83e8264ecf986ca" },
    { symbol: "UNI", name: "Uniswap", chain: "ETH", priceUsd: 7.80, rank: 22, contractAddress: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984" },
    { symbol: "AAVE", name: "Aave", chain: "ETH", priceUsd: 95.40, rank: 35, contractAddress: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9" },
    { symbol: "MATIC", name: "Polygon", chain: "MATIC", priceUsd: 0.72, rank: 14, contractAddress: null },
    { symbol: "SOL", name: "Solana", chain: "SOL", priceUsd: 148.30, rank: 5, contractAddress: null },
    { symbol: "BNB", name: "BNB", chain: "BNB", priceUsd: 385.00, rank: 4, contractAddress: null },
    { symbol: "ARB", name: "Arbitrum", chain: "ARB", priceUsd: 0.85, rank: 45, contractAddress: null },
    { symbol: "OP", name: "Optimism", chain: "OP", priceUsd: 1.92, rank: 55, contractAddress: null },
    { symbol: "FRAX", name: "Frax", chain: "ETH", priceUsd: 1.00, rank: 150, contractAddress: "0x853d955acef822db058eb8505911ed77f175b99e" },
    { symbol: "JUP", name: "Jupiter", chain: "SOL", priceUsd: 0.68, rank: 70, contractAddress: null },
    { symbol: "PYTH", name: "Pyth Network", chain: "SOL", priceUsd: 0.32, rank: 90, contractAddress: null },
  ];
  res.json(knownTokens.map((t, i) => ({ ...t, logoUrl: null })));
});

router.post("/:id/toggle", async (req, res) => {
  const { id } = ToggleTokenParams.parse({ id: Number(req.params.id) });
  const [token] = await db.select().from(tokensTable).where(eq(tokensTable.id, id)).limit(1);
  if (!token) return res.status(404).json({ error: "Token not found" });
  const [updated] = await db.update(tokensTable).set({ isEnabled: !token.isEnabled }).where(eq(tokensTable.id, id)).returning();
  res.json(updated);
});

export default router;
