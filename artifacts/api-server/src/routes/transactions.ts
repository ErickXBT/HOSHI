import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListTransactionsParams, CreateTransactionBody } from "@workspace/api-zod";

const router = Router();

router.get("/recent/all", async (req, res) => {
  const txs = await db.select().from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(20);
  res.json(txs.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.get("/:walletId", async (req, res) => {
  const { walletId } = ListTransactionsParams.parse({ walletId: Number(req.params.walletId) });
  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.walletId, walletId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(50);
  res.json(txs.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = CreateTransactionBody.parse(req.body);
  const walletIdBody = (req.body as any).walletId ?? 1;
  const [tx] = await db.insert(transactionsTable).values({
    walletId: walletIdBody,
    type: body.type,
    tokenSymbol: body.tokenSymbol,
    amount: body.amount,
    amountUsd: body.amountUsd,
    chain: body.chain,
    fromAddress: body.fromAddress ?? null,
    toAddress: body.toAddress ?? null,
    txHash: body.txHash ?? null,
    status: "confirmed",
    gasUsd: body.gasUsd ?? null,
  }).returning();
  res.status(201).json({ ...tx, createdAt: tx.createdAt.toISOString() });
});

export default router;
