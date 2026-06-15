import { Router } from "express";
import { db } from "@workspace/db";
import { affiliateTable } from "@workspace/db";

const router = Router();

router.get("/", async (_req, res) => {
  let [stats] = await db.select().from(affiliateTable).limit(1);
  if (!stats) {
    [stats] = await db.insert(affiliateTable).values({
      referralCode: "hoshi_" + Math.random().toString(36).substring(2, 10),
      referralLink: "https://hoshi.app/ref?code=default",
      totalReferrals: 3,
      volumeSwapUsd: 12450.00,
      commissionUsd: 12.45,
      tokensEarned: 248.9,
      tokensClaimed: 49.78,
    }).returning();
    await db.update(affiliateTable).set({ referralLink: `https://hoshi.app/ref?code=${stats.referralCode}` });
    stats.referralLink = `https://hoshi.app/ref?code=${stats.referralCode}`;
  }
  res.json(stats);
});

router.post("/claim", async (_req, res) => {
  const [stats] = await db.select().from(affiliateTable).limit(1);
  if (!stats) return res.status(404).json({ error: "No affiliate record" });
  const [updated] = await db.update(affiliateTable)
    .set({ tokensClaimed: stats.tokensEarned })
    .returning();
  res.json(updated);
});

export default router;
