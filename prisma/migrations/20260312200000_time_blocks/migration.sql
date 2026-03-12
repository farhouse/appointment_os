-- Time blocks for staff availability blocking (calendar + booking)

CREATE TABLE IF NOT EXISTS "TimeBlock" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "professionalId" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- FKs (idempotent)
DO $$
BEGIN
  ALTER TABLE "TimeBlock"
    ADD CONSTRAINT "TimeBlock_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TimeBlock"
    ADD CONSTRAINT "TimeBlock_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TimeBlock"
    ADD CONSTRAINT "TimeBlock_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS "TimeBlock_branchId_idx" ON "TimeBlock"("branchId");
CREATE INDEX IF NOT EXISTS "TimeBlock_professionalId_idx" ON "TimeBlock"("professionalId");
CREATE INDEX IF NOT EXISTS "TimeBlock_startTime_endTime_idx" ON "TimeBlock"("startTime", "endTime");
