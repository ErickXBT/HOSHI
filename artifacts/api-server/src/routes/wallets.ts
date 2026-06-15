import { Router } from "express";
import { db } from "@workspace/db";
import { walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateWalletBody,
  UpdateWalletParams,
  UpdateWalletBody,
  DeleteWalletParams,
  GetWalletParams,
  ActivateWalletParams,
  GetPortfolioParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const wallets = await db.select().from(walletsTable).orderBy(walletsTable.id);
  res.json(wallets.map(w => ({ ...w, createdAt: w.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = CreateWalletBody.parse(req.body);
  // Deactivate all others when creating a new wallet
  const [wallet] = await db.insert(walletsTable).values({
    name: body.name,
    address: body.address,
    chain: body.chain,
    isActive: true,
    totalBalanceUsd: Math.random() * 5000 + 100,
  }).returning();
  // set others inactive
  await db.update(walletsTable).set({ isActive: false }).where(eq(walletsTable.id, wallet.id === 0 ? -1 : wallet.id));
  await db.update(walletsTable).set({ isActive: true }).where(eq(walletsTable.id, wallet.id));
  res.status(201).json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.get("/active", async (req, res) => {
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.isActive, true)).limit(1);
  if (!wallet) return res.status(404).json({ error: "No active wallet" });
  res.json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const { id } = GetWalletParams.parse({ id: Number(req.params.id) });
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, id)).limit(1);
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const { id } = UpdateWalletParams.parse({ id: Number(req.params.id) });
  const body = UpdateWalletBody.parse(req.body);
  const [wallet] = await db.update(walletsTable).set(body).where(eq(walletsTable.id, id)).returning();
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteWalletParams.parse({ id: Number(req.params.id) });
  await db.delete(walletsTable).where(eq(walletsTable.id, id));
  res.status(204).send();
});

router.post("/:id/activate", async (req, res) => {
  const { id } = ActivateWalletParams.parse({ id: Number(req.params.id) });
  await db.update(walletsTable).set({ isActive: false });
  const [wallet] = await db.update(walletsTable).set({ isActive: true }).where(eq(walletsTable.id, id)).returning();
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.get("/:id/portfolio", async (req, res) => {
  const { id } = GetPortfolioParams.parse({ id: Number(req.params.id) });
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, id)).limit(1);
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });

  // Generate 7-day chart data
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const base = wallet.totalBalanceUsd * 0.92;
  const chartData = days.map((label, i) => ({
    label,
    value: parseFloat((base + (wallet.totalBalanceUsd - base) * (i / 6) + Math.random() * base * 0.05).toFixed(2)),
  }));

  const gainUsd = parseFloat((wallet.totalBalanceUsd * 0.0321).toFixed(2));
  const gainPct = parseFloat(((gainUsd / wallet.totalBalanceUsd) * 100).toFixed(2));

  res.json({
    totalBalanceUsd: wallet.totalBalanceUsd,
    gainUsd,
    gainPct,
    activeAssets: 44,
    diversificationPct: 66,
    lastUpdated: new Date().toISOString(),
    chartData,
    gainsByPeriod: [
      { period: "1 Day", gainUsd: gainUsd * 0.15, gainPct: gainPct * 0.15 },
      { period: "7 Days", gainUsd, gainPct },
      { period: "30 Days", gainUsd: gainUsd * 4.2, gainPct: gainPct * 4.2 },
      { period: "90 Days", gainUsd: gainUsd * 11.5, gainPct: gainPct * 11.5 },
    ],
  });
});

export default router;
