ALTER TABLE "User" ADD COLUMN "clientId" TEXT;

UPDATE "User" u
SET "clientId" = c."id"
FROM "Client" c
WHERE u."role" = 'CLIENT'
  AND u."clientId" IS NULL
  AND u."email" IS NOT NULL
  AND c."email" = u."email";

CREATE UNIQUE INDEX "User_clientId_key" ON "User"("clientId");

ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
