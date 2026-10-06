import { Router } from "express";
import { getWalletTransactions, topupWallet } from "../controllers/wallet.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/wallet/transactions",
  authenticate,
  getWalletTransactions
);

router.post(
  "/wallet/topup",
  authenticate,
  topupWallet
);

export default router;

