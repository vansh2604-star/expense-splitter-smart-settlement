import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const recordSettlementPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const groupIdParam = req.params.groupId;

    const groupId = Array.isArray(groupIdParam)
      ? groupIdParam[0]
      : groupIdParam;

    const { toUserId, amount } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    if (!toUserId || typeof toUserId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid receiver user ID is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number greater than 0",
      });
    }

    const paymentAmount =
      Math.round(numericAmount * 100) / 100;

    if (userId === toUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot record a settlement payment to yourself",
      });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const senderMembership =
      await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

    if (!senderMembership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const receiverMembership =
      await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: toUserId,
            groupId,
          },
        },
      });

    if (!receiverMembership) {
      return res.status(400).json({
        success: false,
        message: "Receiver is not a member of this group",
      });
    }

    const settlementPayment =
      await prisma.settlementPayment.create({
        data: {
          groupId,
          fromUserId: userId,
          toUserId,
          amount: paymentAmount,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message: "Settlement payment recorded successfully",
      settlementPayment,
    });
  } catch (error) {
    console.error(
      "Record settlement payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSettlementPaymentHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const groupIdParam = req.params.groupId;

    const groupId = Array.isArray(groupIdParam)
      ? groupIdParam[0]
      : groupIdParam;

    const userId = req.userId;

    // Authentication check
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validate group ID
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    // Check group exists
    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check user belongs to the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // Get settlement payment history
    const payments = await prisma.settlementPayment.findMany({
      where: {
        groupId,
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
    
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
    
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    

    return res.status(200).json({
      success: true,
      group,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get settlement payment history error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

