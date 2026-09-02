import { Router } from "express";
import { getWalletTransactions } from "../controllers/wallet.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/wallet/transactions",
  authenticate,
  getWalletTransactions
);

export default router;

