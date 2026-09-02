import { Router } from "express";
import { createExpense } from "../controllers/expense.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/groups/:groupId/expenses",
  authenticate,
  createExpense
);

export default router;


