-- AlterTable
ALTER TABLE "PaymentMethodConfig"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing rows
UPDATE "PaymentMethodConfig"
SET
  "name" = COALESCE("name", "method"::text),
  "isSystem" = true
WHERE "name" IS NULL OR "isSystem" = false;

-- Make name required
ALTER TABLE "PaymentMethodConfig"
  ALTER COLUMN "name" SET NOT NULL;

-- Replace unique(method) with index(method) to allow multiple media/profile rows per base method
DROP INDEX IF EXISTS "PaymentMethodConfig_method_key";
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_method_idx" ON "PaymentMethodConfig"("method");
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_active_idx" ON "PaymentMethodConfig"("active");
