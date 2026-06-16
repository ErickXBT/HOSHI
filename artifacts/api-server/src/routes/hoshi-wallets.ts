import { Router } from "express";
import { db } from "@workspace/db";
import { hoshiWalletsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const deviceId = req.query.deviceId as string;
  if (!deviceId) return res.status(400).json({ error: "deviceId required" });
  const wallets = await db
    .select()
    .from(hoshiWalletsTable)
    .where(eq(hoshiWalletsTable.deviceId, deviceId))
    .orderBy(hoshiWalletsTable.createdAt);
  res.json(wallets.map(w => ({ ...w, createdAt: w.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { deviceId, walletId, name, evmAddress, solAddress, encrypted } = req.body;
  if (!deviceId || !walletId || !name || !evmAddress || !solAddress || !encrypted) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const [wallet] = await db
    .insert(hoshiWalletsTable)
    .values({ deviceId, walletId, name, evmAddress, solAddress, encrypted })
    .onConflictDoUpdate({
      target: hoshiWalletsTable.walletId,
      set: { name, encrypted },
    })
    .returning();
  res.status(201).json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.put("/:walletId", async (req, res) => {
  const { walletId } = req.params;
  const { name, encrypted } = req.body;
  const [wallet] = await db
    .update(hoshiWalletsTable)
    .set({ ...(name && { name }), ...(encrypted && { encrypted }) })
    .where(eq(hoshiWalletsTable.walletId, walletId))
    .returning();
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json({ ...wallet, createdAt: wallet.createdAt.toISOString() });
});

router.delete("/:walletId", async (req, res) => {
  const { walletId } = req.params;
  const deviceId = req.query.deviceId as string;
  await db
    .delete(hoshiWalletsTable)
    .where(
      deviceId
        ? and(eq(hoshiWalletsTable.walletId, walletId), eq(hoshiWalletsTable.deviceId, deviceId))
        : eq(hoshiWalletsTable.walletId, walletId)
    );
  res.status(204).send();
});

export default router;
