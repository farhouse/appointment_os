ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "paidPaymentMediumId" TEXT;

ALTER TABLE "Sale"
  ADD COLUMN IF NOT EXISTS "paymentMediumId" TEXT;

ALTER TABLE "CashMovement"
  ADD COLUMN IF NOT EXISTS "paymentMediumId" TEXT;

CREATE INDEX IF NOT EXISTS "Appointment_paidPaymentMediumId_idx" ON "Appointment"("paidPaymentMediumId");
CREATE INDEX IF NOT EXISTS "Sale_paymentMediumId_idx" ON "Sale"("paymentMediumId");
CREATE INDEX IF NOT EXISTS "CashMovement_paymentMediumId_idx" ON "CashMovement"("paymentMediumId");

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_paidPaymentMediumId_fkey"
  FOREIGN KEY ("paidPaymentMediumId") REFERENCES "PaymentMethodConfig"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Sale"
  ADD CONSTRAINT "Sale_paymentMediumId_fkey"
  FOREIGN KEY ("paymentMediumId") REFERENCES "PaymentMethodConfig"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashMovement"
  ADD CONSTRAINT "CashMovement_paymentMediumId_fkey"
  FOREIGN KEY ("paymentMediumId") REFERENCES "PaymentMethodConfig"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
