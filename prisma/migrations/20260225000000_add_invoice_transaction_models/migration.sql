-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SATIS', 'IADE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED', 'SENT_TO_GIB', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'PARTIAL_REFUND');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable: SiteSettings - Add invoice company fields
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyTaxNumber" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyTaxOffice" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyAddress" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyCity" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyDistrict" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyZipCode" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyPhone" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyIban" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceCompanyLogoKey" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "invoicePrefix" TEXT NOT NULL DEFAULT 'DTF-F';
ALTER TABLE "SiteSettings" ADD COLUMN "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SiteSettings" ADD COLUMN "efaturaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "efaturaCompanyCode" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "efaturaUsername" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "efaturaPassword" TEXT;

-- AlterTable: OrderStatusHistory - Add eventType
ALTER TABLE "OrderStatusHistory" ADD COLUMN "eventType" TEXT;

-- CreateTable: Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'SATIS',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "sellerName" TEXT NOT NULL,
    "sellerTaxNumber" TEXT NOT NULL,
    "sellerTaxOffice" TEXT NOT NULL,
    "sellerAddress" TEXT,
    "sellerCity" TEXT,
    "sellerPhone" TEXT,
    "billingType" "BillingType" NOT NULL,
    "billingFullName" TEXT,
    "billingCompanyName" TEXT,
    "billingTaxOffice" TEXT,
    "billingTaxNumber" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingDistrict" TEXT,
    "billingZipCode" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineItems" JSONB NOT NULL,
    "pdfKey" TEXT,
    "gibInvoiceId" TEXT,
    "gibStatus" TEXT,
    "ublXmlKey" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentTransaction
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "gatewayRef" TEXT,
    "gatewayData" JSONB,
    "refundReason" TEXT,
    "refundedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");
CREATE INDEX "PaymentTransaction_type_idx" ON "PaymentTransaction"("type");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
