-- AlterTable: Add billingFirstName and billingLastName to User, Order, Invoice
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingFirstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingLastName" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingFirstName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingLastName" TEXT;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "billingFirstName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "billingLastName" TEXT;
