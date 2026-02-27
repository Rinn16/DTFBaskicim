# Faz C: Eksik Altyapı — Tasarım

> Tarih: 2026-02-27
> Durum: Onaylandı

## C.1: E-Fatura Durum Kontrolü Cron Job

**Mevcut altyapı:** `scripts/export-worker.ts` içinde BullMQ cron worker zaten 3 job çalıştırıyor. Yeni job eklemek = `cronQueue.add()` + switch case.

**Tasarım:**
- `check-efatura-status` adında yeni cron job, her 30 dakikada bir (`*/30 * * * *`)
- `SENT_TO_GIB` durumundaki faturaları DB'den çek
- Her biri için Trendyol API'den durum kontrol et (`getEFaturaProvider()`)
- Durum değiştiyse (ACCEPTED veya REJECTED) DB'de güncelle
- E-fatura ayarları kapalıysa (`efaturaEnabled: false`) sessizce atla

## C.2: Admin Yeni Sipariş Email Bildirimi

**Mevcut altyapı:** `email.service.ts`'de `sendEmail()` helper var. Admin email = `SiteSettings.invoiceCompanyEmail` || `SMTP_FROM`.

**Tasarım:**
- `email.service.ts`'ye `sendAdminNewOrderNotification(orderData)` fonksiyonu
- Admin email adresini SiteSettings'ten çek (contact form pattern'i)
- Basit hardcoded HTML email (sipariş no, müşteri adı, toplam, tarih)
- `order.service.ts`'de fire-and-forget çağır
- `SiteSettings`'e `emailAdminNewOrder Boolean @default(true)` toggle
