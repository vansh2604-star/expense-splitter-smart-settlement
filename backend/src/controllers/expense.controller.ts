import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { groupId: rawGroupId } = req.params;
    const { description, amount, participantIds } = req.body;
    const rawUserId = req.userId;

    // Authentication check
    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const userId: string = rawUserId;

    // Validate group ID
    if (!rawGroupId || Array.isArray(rawGroupId)) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }
    const groupId: string = rawGroupId;

    // Validate description
    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense description is required",
      });
    }

    // Validate amount
    const expenseAmount = Number(amount);

if (
  !Number.isFinite(expenseAmount) ||
  expenseAmount <= 0
) {
  return res.status(400).json({
    success: false,
    message: "Amount must be a valid number greater than 0",
  });
}



    // Validate participants
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one participant is required",
      });
    }

    // Dedupe participant IDs (avoids unique constraint failure on ExpenseSplit)
    const uniqueParticipantIds: string[] = [...new Set(participantIds as string[])];

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if requesting user belongs to group
    const requestingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!requestingMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // Get all selected participants who belong to the group
    const participants = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: {
          in: uniqueParticipantIds,
        },
      },
      select: {
        userId: true,
      },
    });

    // Make sure every selected participant belongs to group
    if (participants.length !== uniqueParticipantIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more participants are not members of this group",
      });
    }

    // Calculate equal split in integer cents, distributing remainder
    // to the first few participants so the split always sums exactly
    // to the total expense amount (avoids float rounding drift).
    const totalCents = Math.round(expenseAmount * 100);
    const n = uniqueParticipantIds.length;
    const baseCents = Math.floor(totalCents / n);
    const remainderCents = totalCents - baseCents * n;

    const splitData = uniqueParticipantIds.map((participantId, index) => ({
      userId: participantId,
      amount: (baseCents + (index < remainderCents ? 1 : 0)) / 100,
    }));

    // Create expense and splits inside a transaction
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          description: description.trim(),
          amount: expenseAmount,
          groupId,
          paidById: userId,
        },
      });

      await tx.expenseSplit.createMany({
        data: splitData.map((split) => ({
          expenseId: newExpense.id,
          userId: split.userId,
          amount: split.amount,
        })),
      });

      return newExpense;
    });

    // Get complete expense data
    const expenseWithDetails = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: expenseWithDetails,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


