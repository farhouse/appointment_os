/*
  Warnings:

  - A unique constraint covering the columns `[appointmentId]` on the table `LoyaltyLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LoyaltyLedger" ADD COLUMN     "appointmentId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "pointsCost" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Redemption_clientId_idx" ON "Redemption"("clientId");

-- CreateIndex
CREATE INDEX "Redemption_productId_idx" ON "Redemption"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyLedger_appointmentId_key" ON "LoyaltyLedger"("appointmentId");

-- AddForeignKey
ALTER TABLE "LoyaltyLedger" ADD CONSTRAINT "LoyaltyLedger_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
