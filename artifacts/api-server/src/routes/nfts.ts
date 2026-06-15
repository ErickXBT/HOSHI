import { Router } from "express";
import { db } from "@workspace/db";
import { nftsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListNftsParams, GetNftParams } from "@workspace/api-zod";

const router = Router();

router.get("/detail/:id", async (req, res) => {
  const { id } = GetNftParams.parse({ id: Number(req.params.id) });
  const [nft] = await db.select().from(nftsTable).where(eq(nftsTable.id, id)).limit(1);
  if (!nft) return res.status(404).json({ error: "NFT not found" });
  res.json(nft);
});

router.get("/:walletId", async (req, res) => {
  const { walletId } = ListNftsParams.parse({ walletId: Number(req.params.walletId) });
  const nfts = await db.select().from(nftsTable).where(eq(nftsTable.walletId, walletId));
  res.json(nfts);
});

export default router;
