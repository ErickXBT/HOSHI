import { Router, type IRouter } from "express";
import healthRouter from "./health";
import walletsRouter from "./wallets";
import tokensRouter from "./tokens";
import transactionsRouter from "./transactions";
import marketRouter from "./market";
import nftsRouter from "./nfts";
import affiliateRouter from "./affiliate";
import settingsRouter from "./settings";
import hoshiWalletsRouter from "./hoshi-wallets";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/wallets", walletsRouter);
router.use("/hoshi-wallets", hoshiWalletsRouter);
router.use("/tokens", tokensRouter);
router.use("/transactions", transactionsRouter);
router.use("/market", marketRouter);
router.use("/nfts", nftsRouter);
router.use("/affiliate", affiliateRouter);
router.use("/settings", settingsRouter);

export default router;
