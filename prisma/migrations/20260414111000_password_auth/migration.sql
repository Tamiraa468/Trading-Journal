-- Add password auth and account lockout fields
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3),
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3);
