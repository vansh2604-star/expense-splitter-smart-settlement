import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

type BalanceMap = Record<string, number>;

export const getGroupSettlements = async (
  req: Request,
  res: Response
) => {
  try {
    const { groupId: rawGroupId } = req.params;
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

    // Check group exists
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

    // Check requesting user belongs to the group
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

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get all expenses with splits
    const expenses = await prisma.expense.findMany({
      where: {
        groupId,
      },
      include: {
        splits: true,
      },
    });

    // Get recorded settlement payments
    const settlementPayments = await prisma.settlementPayment.findMany({
      where: {
        groupId,
      },
    });

    // Start every member with ₹0 balance
    const balances: BalanceMap = {};

    for (const member of members) {
      balances[member.userId] = 0;
    }

    /*
      Balance rules:

      Person who paid an expense:
      + full expense amount

      Every participant in a split:
      - their share

      Person who sent a settlement payment:
      + payment amount (reduces what they owe / adds to what they're owed)

      Person who received a settlement payment:
      - payment amount (reduces what they are owed)

      Final balance:
      Positive = should receive money
      Negative = owes money
    */

    // Apply expenses
    for (const expense of expenses) {
      const payerBalance = balances[expense.paidById];

      if (payerBalance !== undefined) {
        balances[expense.paidById] = payerBalance + Number(expense.amount);
      }

      for (const split of expense.splits) {
        const splitUserBalance = balances[split.userId];

        if (splitUserBalance !== undefined) {
          balances[split.userId] = splitUserBalance - Number(split.amount);
        }
      }
    }

    // Apply settlement payments
    for (const payment of settlementPayments) {
      const paymentAmount = Number(payment.amount);

      const senderBalance = balances[payment.fromUserId];
      if (senderBalance !== undefined) {
        balances[payment.fromUserId] = senderBalance + paymentAmount;
      }

      const receiverBalance = balances[payment.toUserId];
      if (receiverBalance !== undefined) {
        balances[payment.toUserId] = receiverBalance - paymentAmount;
      }
    }

    // Convert balances to integer cents once — this becomes the single
    // source of truth for both the settlement algorithm and the
    // balances shown to the user, so the two never drift apart.
    const balanceCentsMap = new Map<string, number>();

    for (const [memberId, balance] of Object.entries(balances)) {
      balanceCentsMap.set(memberId, Math.round(balance * 100));
    }

    const balancesInCents = Array.from(balanceCentsMap.entries())
      .map(([memberId, balance]) => ({ memberId, balance }))
      .filter((item) => item.balance !== 0);

    // People who should receive money
    const creditors = balancesInCents
      .filter((item) => item.balance > 0)
      .map((item) => ({
        memberId: item.memberId,
        amount: item.balance,
      }));

    // People who owe money
    const debtors = balancesInCents
      .filter((item) => item.balance < 0)
      .map((item) => ({
        memberId: item.memberId,
        amount: Math.abs(item.balance),
      }));

    const settlements: {
      fromUserId: string;
      toUserId: string;
      amount: number;
    }[] = [];

    let debtorIndex = 0;
    let creditorIndex = 0;

    // Smart settlement algorithm (greedy min-cash-flow)
    while (
      debtorIndex < debtors.length &&
      creditorIndex < creditors.length
    ) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      // Guaranteed to exist by the while condition above, but TypeScript's
      // noUncheckedIndexedAccess can't infer that from array length checks.
      if (!debtor || !creditor) {
        break;
      }

      const settlementAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        fromUserId: debtor.memberId,
        toUserId: creditor.memberId,
        amount: settlementAmount / 100,
      });

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount === 0) {
        debtorIndex++;
      }

      if (creditor.amount === 0) {
        creditorIndex++;
      }
    }

    // Add user details to balances
    const memberMap = new Map(
      members.map((member) => [
        member.userId,
        {
          name: member.user.name,
          email: member.user.email,
        },
      ])
    );

    // Derived from the SAME balanceCentsMap used for settlements above,
    // so displayed balances always match what the settlements imply.
    const balanceDetails = members.map((member) => ({
      user: memberMap.get(member.userId),
      balance: (balanceCentsMap.get(member.userId) ?? 0) / 100,
    }));

    // Add user details to settlements
    const settlementDetails = settlements.map((settlement) => ({
      from: memberMap.get(settlement.fromUserId),
      to: memberMap.get(settlement.toUserId),
      amount: settlement.amount,
    }));

    return res.status(200).json({
      success: true,
      group: {
        name: group.name,
      },
      balances: balanceDetails,
      settlements: settlementDetails,
    });
  } catch (error) {
    console.error("Get settlements error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

