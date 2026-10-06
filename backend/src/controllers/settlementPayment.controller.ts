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

    // Validate receiver
    if (!toUserId || typeof toUserId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid receiver user ID is required",
      });
    }

    // Validate amount
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number greater than 0",
      });
    }

    // Round to 2 decimal places
    const paymentAmount =
      Math.round(numericAmount * 100) / 100;

    // Cannot pay yourself
    if (userId === toUserId) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot record a settlement payment to yourself",
      });
    }

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

    // Check sender belongs to group
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

    // Check receiver belongs to group
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
     

    // Get all group members
const groupMembers = await prisma.groupMember.findMany({
  where: {
    groupId,
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

// Get all previous settlement payments
const previousPayments =
  await prisma.settlementPayment.findMany({
    where: {
      groupId,
    },
  });

// 1. Start every member with zero balance
const balances: Record<string, number> = {};

for (const member of groupMembers) {
  balances[member.userId] = 0;
}

// Apply expenses
for (const expense of expenses) {
  balances[expense.paidById] =
    (balances[expense.paidById] ?? 0) +
    Number(expense.amount);

  for (const split of expense.splits) {
    balances[split.userId] =
      (balances[split.userId] ?? 0) -
      Number(split.amount);
  }
}

// Apply previous settlement payments
for (const payment of previousPayments) {
  const amount = Number(payment.amount);

  // Sender's debt decreases
  balances[payment.fromUserId] =
    (balances[payment.fromUserId] ?? 0) + amount;

  // Receiver is owed less
  balances[payment.toUserId] =
    (balances[payment.toUserId] ?? 0) - amount;
}

// Get balances for the two users involved
// Convert balances to integer cents to avoid floating-point issues
const balancesInCents = Object.entries(balances)
  .map(([memberId, balance]) => ({
    memberId,
    balance: Math.round(balance * 100),
  }))
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

// Generate settlement suggestions
const settlements: {
  fromUserId: string;
  toUserId: string;
  amount: number;
}[] = [];

let debtorIndex = 0;
let creditorIndex = 0;

while (
  debtorIndex < debtors.length &&
  creditorIndex < creditors.length
) {
  const debtor = debtors[debtorIndex];
  const creditor = creditors[creditorIndex];

  if (!debtor || !creditor) {
    break;
  }

  const settlementAmount = Math.min(
    debtor.amount,
    creditor.amount
  );

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

// Find the exact settlement between sender and receiver
const matchingSettlement = settlements.find(
  (settlement) =>
    settlement.fromUserId === userId &&
    settlement.toUserId === toUserId
);

// Sender does not currently owe this receiver
if (!matchingSettlement) {
  return res.status(400).json({
    success: false,
    message: "You do not owe money to this user",
  });
}

// Prevent paying more than the exact amount owed
if (paymentAmount > matchingSettlement.amount) {
  return res.status(400).json({
    success: false,
    message: `Payment amount exceeds the amount you owe to this user. You can pay up to ${matchingSettlement.amount}`,
  });
}



// Check sender wallet
const senderWallet = await prisma.wallet.findUnique({
  where: {
    userId,
  },
});

if (!senderWallet) {
  return res.status(404).json({
    success: false,
    message: "Sender wallet not found",
  });
}

// Prevent payment if wallet balance is insufficient
if (Number(senderWallet.balance) < paymentAmount) {
  return res.status(400).json({
    success: false,
    message: "Insufficient wallet balance",
  });
}




    // ==========================================
    // WALLET TRANSFER + SETTLEMENT TRANSACTION
    // ==========================================

    const result = await prisma.$transaction(
      async (tx) => {
        // Get sender wallet
        const senderWallet =
          await tx.wallet.findUnique({
            where: {
              userId,
            },
          });

        if (!senderWallet) {
          throw new Error("Sender wallet not found");
        }

        // Get receiver wallet
        const receiverWallet =
          await tx.wallet.findUnique({
            where: {
              userId: toUserId,
            },
          });

        if (!receiverWallet) {
          throw new Error("Receiver wallet not found");
        }

        // Check sender has enough balance
        if (
          Number(senderWallet.balance) <
          paymentAmount
        ) {
          throw new Error(
            "Insufficient wallet balance"
          );
        }

        // Deduct money from sender wallet
        const updatedSenderWallet =
          await tx.wallet.update({
            where: {
              id: senderWallet.id,
            },
            data: {
              balance: {
                decrement: paymentAmount,
              },
            },
          });

        // Add money to receiver wallet
        const updatedReceiverWallet =
          await tx.wallet.update({
            where: {
              id: receiverWallet.id,
            },
            data: {
              balance: {
                increment: paymentAmount,
              },
            },
          });

        // Create sender DEBIT transaction
       // Create sender DEBIT transaction
await tx.walletTransaction.create({
  data: {
    walletId: senderWallet.id,
    amount: paymentAmount,
    type: "DEBIT",
    reason: "Settlement payment",
    relatedUserId: toUserId,
  },
});

// Create receiver CREDIT transaction
await tx.walletTransaction.create({
  data: {
    walletId: receiverWallet.id,
    amount: paymentAmount,
    type: "CREDIT",
    reason: "Settlement received",

    // Person who sent the payment
    relatedUserId: userId,
  },
});


        // Create settlement payment record
        const settlementPayment =
          await tx.settlementPayment.create({
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

        return {
          settlementPayment,

          senderWallet: {
            id: updatedSenderWallet.id,
            balance: updatedSenderWallet.balance,
          },

          receiverWallet: {
            id: updatedReceiverWallet.id,
            balance: updatedReceiverWallet.balance,
          },
        };
      }
    );

    return res.status(201).json({
      success: true,
      message: "Settlement payment completed successfully",
    
      settlementPayment: {
        id: result.settlementPayment.id,
        amount: result.settlementPayment.amount,
        createdAt: result.settlementPayment.createdAt,
    
        fromUser: {
          name: result.settlementPayment.fromUser.name,
          email: result.settlementPayment.fromUser.email,
        },
    
        toUser: {
          name: result.settlementPayment.toUser.name,
          email: result.settlementPayment.toUser.email,
        },
      },
    
      wallets: {
        sender: {
          balance: result.senderWallet.balance,
        },
    
        receiver: {
          balance: result.receiverWallet.balance,
        },
      },
    });



  } catch (error) {
    console.error(
      "Record settlement payment error:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message === "Sender wallet not found" ||
        error.message === "Receiver wallet not found"
      ) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
        "Insufficient wallet balance"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

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
    const membership =
      await prisma.groupMember.findUnique({
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
        message:
          "You are not a member of this group",
      });
    }

    // Get settlement payment history
    const payments =
      await prisma.settlementPayment.findMany({
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
    console.error(
      "Get settlement payment history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

