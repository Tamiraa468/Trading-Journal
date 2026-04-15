/*
  Warnings:

  - A unique constraint covering the columns `[mt5DealId]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[syncToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TradeSource" AS ENUM ('MANUAL', 'MT5_SYNC');

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "commission" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "magic" INTEGER DEFAULT 0,
ADD COLUMN     "mt5DealId" TEXT,
ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "TradeSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "swap" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "mt5InvestorPass" TEXT,
ADD COLUMN     "mt5Login" TEXT,
ADD COLUMN     "mt5Server" TEXT,
ADD COLUMN     "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "syncToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Trade_mt5DealId_key" ON "Trade"("mt5DealId");

-- CreateIndex
CREATE UNIQUE INDEX "User_syncToken_key" ON "User"("syncToken");
