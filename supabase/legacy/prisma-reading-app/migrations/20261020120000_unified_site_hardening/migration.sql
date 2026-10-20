-- Unified site (Oct 2026): session revocation, idempotent payment credit, AI reading cache.
-- Safe to run more than once (Supabase SQL Editor or `prisma migrate deploy`).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_razorpayPaymentId_key" ON "Order"("razorpayPaymentId");

CREATE TABLE IF NOT EXISTS "AiReading" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "card" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiReading_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiReading_tokenHash_key" ON "AiReading"("tokenHash");
CREATE INDEX IF NOT EXISTS "AiReading_userId_createdAt_idx" ON "AiReading"("userId", "createdAt");
