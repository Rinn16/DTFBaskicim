-- AlterTable: Replace old efatura auth fields with simplified single-step auth
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaCompanyCode";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaUsername";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaPassword";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaPartnerEmail";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaPartnerPassword";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaCustomerEmail";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaCustomerPassword";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "efaturaCustomerTaxId";

ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "efaturaEnvironment" TEXT NOT NULL DEFAULT 'test';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "efaturaEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "efaturaPassword" TEXT;
