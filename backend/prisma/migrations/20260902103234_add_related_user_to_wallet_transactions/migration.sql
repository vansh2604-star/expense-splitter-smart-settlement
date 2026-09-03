-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "relatedUserId" TEXT;

-- CreateIndex
CREATE INDEX "WalletTransaction_relatedUserId_idx" ON "WalletTransaction"("relatedUserId");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
