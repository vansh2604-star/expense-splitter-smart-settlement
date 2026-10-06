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
            include: {
              relatedUser: {
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

        relatedUser: transaction.relatedUser
      ? {
          name: transaction.relatedUser.name,
          email: transaction.relatedUser.email,
        }
      : null,

      
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

export const topupWallet = async (
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

    const { amount } = req.body;
    const numAmount = Number(amount);

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Top-up amount must be greater than 0",
      });
    }

    const topupAmount = Math.round(numAmount * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: req.userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: topupAmount,
          },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: topupAmount,
          type: "CREDIT",
          reason: `Demo balance top-up (+₹${topupAmount})`,
        },
      });

      return { updatedWallet, transaction };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully added ₹${topupAmount} to your wallet`,
      wallet: {
        id: result.updatedWallet.id,
        balance: result.updatedWallet.balance,
      },
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Top-up wallet error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

