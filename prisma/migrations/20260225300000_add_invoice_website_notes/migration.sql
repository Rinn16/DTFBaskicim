-- AlterTable: Add website and notes fields to SiteSettings for invoice customization
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "invoiceCompanyWebsite" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "invoiceNotes" TEXT;
