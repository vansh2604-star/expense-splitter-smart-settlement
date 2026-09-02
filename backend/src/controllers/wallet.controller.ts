import type { Response } from "express";
import { prisma } from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getWalletTransactions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: req.userId,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
      },
      transactions: wallet.transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        reason: transaction.reason,
        createdAt: transaction.createdAt,
      })),

      
    });
  } catch (error) {
    console.error("Get wallet transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

