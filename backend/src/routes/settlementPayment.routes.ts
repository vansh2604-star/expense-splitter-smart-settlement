import { Router } from "express";
import {
    recordSettlementPayment,
    getSettlementPaymentHistory,
  } from "../controllers/settlementPayment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// record Settle payment 
router.post(
  "/groups/:groupId/settlements/pay",
  authenticate,
  recordSettlementPayment
);


// Get settlement payment history
router.get(
    "/groups/:groupId/settlements/history",
    authenticate,
    getSettlementPaymentHistory
  );

export default router;

