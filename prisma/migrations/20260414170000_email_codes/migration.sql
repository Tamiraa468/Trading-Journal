-- Add email verification state and one-time code storage
CREATE TYPE "EmailCodePurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

ALTER TABLE "User"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Keep existing users working after rollout.
UPDATE "User"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "EmailCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" "EmailCodePurpose" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attemptsLeft" INTEGER NOT NULL DEFAULT 5,
  "resendNotBefore" TIMESTAMP(3) NOT NULL,
  "sentCount" INTEGER NOT NULL DEFAULT 1,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailCode_userId_purpose_key" ON "EmailCode"("userId", "purpose");
CREATE INDEX "EmailCode_expiresAt_idx" ON "EmailCode"("expiresAt");
CREATE INDEX "EmailCode_purpose_consumedAt_idx" ON "EmailCode"("purpose", "consumedAt");

ALTER TABLE "EmailCode"
ADD CONSTRAINT "EmailCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
