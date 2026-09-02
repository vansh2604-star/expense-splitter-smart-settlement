import { Router } from "express";
import { getGroupSettlements } from "../controllers/settlement.controller";
import { authenticate} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/:groupId/settlements",
  authenticate,
  getGroupSettlements
);

export default router;

