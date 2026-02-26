-- Add notification opt-in fields to User
ALTER TABLE "User" ADD COLUMN "emailOptIn" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "smsOptIn" BOOLEAN NOT NULL DEFAULT true;
