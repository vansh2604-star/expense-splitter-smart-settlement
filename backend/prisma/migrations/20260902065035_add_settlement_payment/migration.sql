-- CreateTable
CREATE TABLE "SettlementPayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,

    CONSTRAINT "SettlementPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettlementPayment_groupId_idx" ON "SettlementPayment"("groupId");

-- CreateIndex
CREATE INDEX "SettlementPayment_fromUserId_idx" ON "SettlementPayment"("fromUserId");

-- CreateIndex
CREATE INDEX "SettlementPayment_toUserId_idx" ON "SettlementPayment"("toUserId");

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
