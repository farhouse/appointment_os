CREATE TABLE "LandingConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "html" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LandingConfig_pkey" PRIMARY KEY ("id")
);
