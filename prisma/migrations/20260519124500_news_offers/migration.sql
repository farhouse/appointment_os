CREATE TABLE "NewsOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewsOffer_active_idx" ON "NewsOffer"("active");
CREATE INDEX "NewsOffer_startsAt_endsAt_idx" ON "NewsOffer"("startsAt", "endsAt");
