-- Align the migration history with fields that were previously applied only via db push.
ALTER TABLE "Appointment"
  ADD COLUMN "confirmToken" TEXT,
  ADD COLUMN "confirmTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Appointment_confirmToken_key" ON "Appointment"("confirmToken");

ALTER TABLE "Service"
  ADD COLUMN "pointsReward" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Sale"
  ADD COLUMN "appointmentId" TEXT,
  ALTER COLUMN "paymentMethod" DROP NOT NULL;

CREATE UNIQUE INDEX "Sale_appointmentId_key" ON "Sale"("appointmentId");

ALTER TABLE "Sale"
  ADD CONSTRAINT "Sale_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "serviceId" TEXT,
  ALTER COLUMN "productId" DROP NOT NULL;

UPDATE "SaleItem" si
SET "name" = COALESCE(p."name", 'Item')
FROM "Product" p
WHERE si."productId" = p."id" AND si."name" IS NULL;

UPDATE "SaleItem" SET "name" = 'Item' WHERE "name" IS NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_productId_fkey";
ALTER TABLE "SaleItem"
  ADD CONSTRAINT "SaleItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleItem"
  ADD CONSTRAINT "SaleItem_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashSession" DROP CONSTRAINT "CashSession_cashBoxId_fkey";
ALTER TABLE "CashSession"
  ADD CONSTRAINT "CashSession_cashBoxId_fkey"
  FOREIGN KEY ("cashBoxId") REFERENCES "CashBox"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "CashSession_cashBoxId_date_key";

ALTER TABLE "CashSession"
  ALTER COLUMN "closingCash" SET DATA TYPE DECIMAL(65,30),
  ALTER COLUMN "closingCard" SET DATA TYPE DECIMAL(65,30),
  ALTER COLUMN "closingTransfer" SET DATA TYPE DECIMAL(65,30),
  ALTER COLUMN "closingOther" SET DATA TYPE DECIMAL(65,30);

CREATE TABLE "BranchWorkingHour" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "isWorking" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BranchWorkingHour_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BranchWorkingHour_branchId_dayOfWeek_key"
  ON "BranchWorkingHour"("branchId", "dayOfWeek");

ALTER TABLE "BranchWorkingHour"
  ADD CONSTRAINT "BranchWorkingHour_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BarberWorkingHour" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "isWorking" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BarberWorkingHour_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarberWorkingHour_userId_dayOfWeek_key"
  ON "BarberWorkingHour"("userId", "dayOfWeek");

ALTER TABLE "BarberWorkingHour"
  ADD CONSTRAINT "BarberWorkingHour_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
