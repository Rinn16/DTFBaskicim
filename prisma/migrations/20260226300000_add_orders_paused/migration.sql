-- Add orders paused fields to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "ordersPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "ordersPausedMessage" TEXT;
