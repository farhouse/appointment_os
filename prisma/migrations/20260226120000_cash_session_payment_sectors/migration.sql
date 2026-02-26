-- Add optional payment method to appointments
ALTER TABLE "Appointment" ADD COLUMN "paidPaymentMethod" "PaymentMethod";

-- Update CashSession for branch-level sessions and closing totals by method
ALTER TABLE "CashSession" ALTER COLUMN "cashBoxId" DROP NOT NULL;
ALTER TABLE "CashSession" ADD COLUMN "closingCash" DECIMAL;
ALTER TABLE "CashSession" ADD COLUMN "closingCard" DECIMAL;
ALTER TABLE "CashSession" ADD COLUMN "closingTransfer" DECIMAL;
ALTER TABLE "CashSession" ADD COLUMN "closingOther" DECIMAL;

-- Add payment method and references to CashMovement
ALTER TABLE "CashMovement" ADD COLUMN "saleId" TEXT;
ALTER TABLE "CashMovement" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- Indexes for new references and session lookup
CREATE INDEX "CashSession_branchId_date_idx" ON "CashSession"("branchId", "date");
CREATE INDEX "CashMovement_saleId_idx" ON "CashMovement"("saleId");

-- Foreign key for CashMovement.saleId
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
