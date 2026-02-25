-- AlterTable: Add separate E-Arşiv and E-Fatura prefix fields
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "efaturaEarsivPrefix" TEXT NOT NULL DEFAULT 'DAP';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "efaturaEfaturaPrefix" TEXT NOT NULL DEFAULT 'DIP';
