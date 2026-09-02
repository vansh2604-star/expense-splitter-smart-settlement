import { Router } from "express";

import {
  createGroup,
  addGroupMember,
  getMyGroups,
  getGroupDetails,
} from "../controllers/group.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createGroup);

router.post(
  "/:groupId/members",
  authenticate,
  addGroupMember,
);


router.get("/", authenticate, getMyGroups);

router.get(
    "/:groupId",
    authenticate,
    getGroupDetails
  );

  


export default router;

