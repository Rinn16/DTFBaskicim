# DTF Baskıcım - Kalan İyileştirmeler Planı

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Projedeki kalan eksiklikleri, hata yönetimi sorunlarını ve altyapı iyileştirmelerini tamamlamak.

**Architecture:** Mevcut Next.js 15 + Prisma + PostgreSQL + Redis + MinIO mimarisine sadık kalarak, önce kod kalitesi ve güvenilirlik sorunlarını düzeltip, sonra eksik özellikleri eklemek.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, Redis (BullMQ), MinIO, sonner (toast), shadcn/ui

**Önceki Plan Durumu:** `docs/plans/2026-02-26-missing-features-plan.md` dosyasındaki Faz 1-4 tamamlandı. Faz 5 hiç başlanmadı. Bu plan hem Faz 5'i hem de yeni keşfedilen sorunları kapsar.

---

## Faz A: Kod Kalitesi & Hata Yönetimi

Bu faz kullanıcı ve admin deneyimini doğrudan etkileyen sessiz hataları düzeltir.

### A.1 Sessiz Hata Yutma Düzeltmesi (28+ yer)

**Sorun:** Birçok sayfada API çağrıları başarısız olduğunda kullanıcıya hiçbir geri bildirim verilmiyor. `catch { // silent }` veya `.catch(() => {})` pattern'i kullanılmış.

**Files:**
- Modify: `src/app/(shop)/odeme/page.tsx:123`
- Modify: `src/app/(shop)/hesabim/page.tsx:68`
- Modify: `src/app/(shop)/hesabim/siparislerim/page.tsx:68`
- Modify: `src/app/(shop)/hesabim/siparislerim/[orderNumber]/page.tsx:143`
- Modify: `src/app/(shop)/hesabim/ayarlar/page.tsx:158,176,197,215`
- Modify: `src/app/admin/layout.tsx:106`
- Modify: `src/app/admin/page.tsx:91`
- Modify: `src/app/admin/email/page.tsx:110,142`
- Modify: `src/app/admin/sms/page.tsx:125,139,153`
- Modify: `src/app/admin/ayarlar/page.tsx:124`
- Modify: `src/app/admin/siparisler/page.tsx:89`
- Modify: `src/app/admin/siparisler/[orderId]/page.tsx:200`
- Modify: `src/app/admin/fiyatlandirma/page.tsx:128,252,391`
- Modify: `src/app/admin/musteriler/page.tsx:67`
- Modify: `src/app/admin/musteriler/[id]/page.tsx:79`
- Modify: `src/components/admin/orders/order-transactions.tsx:39`
- Modify: `src/components/admin/orders/order-invoice-card.tsx:61`
- Modify: `src/stores/draft-store.ts:122,142`
- Modify: `src/stores/cart-store.ts:83,121`

**Yaklaşım:** Her `// silent` catch bloğuna `toast.error("Veriler yüklenirken hata oluştu")` ekle. Store'lardaki JSON parse hatalarında `console.warn` ekle. `idb-storage.ts` (line 146) dokunma — IndexedDB write failure sessiz kalabilir.

**Commit:** `fix: replace silent error swallowing with toast notifications (28+ places)`

---

### A.2 Eksik Error Boundary'ler

**Sorun:** `(shop)` ve `admin` route gruplarında `error.tsx` yok. Hatalar root error boundary'ye düşüyor ve bağlam kayboluyor.

**Files:**
- Create: `src/app/(shop)/error.tsx`
- Create: `src/app/admin/error.tsx`

**Pattern:** Mevcut `src/app/error.tsx` pattern'ini kullan. Shop error'da "Ana Sayfa" linki (`/`), admin error'da "Dashboard" linki (`/admin`) ekle.

**Commit:** `feat: add error boundaries for shop and admin route groups`

---

### A.3 Hardcoded Değer Düzeltmeleri

**Sorun:** Bazı sayfalarda hardcoded değerler var.

**Files:**
- Modify: `src/app/(standalone)/odeme/basarili/page.tsx:363` — `© 2025` → `© {new Date().getFullYear()}`
- Modify: `src/app/(standalone)/odeme/basarili/page.tsx:258` — `2 İş Günü` hardcoded teslimat süresi. SiteSettings'ten çekilmeli veya en azından constant'a alınmalı.

**Commit:** `fix: replace hardcoded copyright year and delivery estimate`

---

### A.4 console.log Temizliği

**Sorun:** Production kodunda 12 adet `console.log` var.

**Files:**
- Modify: `src/services/sms.service.ts:200,208,214,246` — `console.log` → kaldır veya `console.info` seviyesine çek
- Modify: `src/services/packing.service.ts:308` — `console.log` → kaldır
- Modify: `src/app/api/payment/paytr/callback/route.ts:140` — `console.log` → `console.error`
- Skip: `src/services/efatura/providers/mock.ts` — mock provider, dokunma
- Skip: `src/app/api/otp/send/route.ts:67` ve `src/app/api/user/change-phone/route.ts:72` — DEV-only guard'lı, dokunma

**Commit:** `fix: clean up console.log statements in production code`

---

### A.5 PackResult Interface Tekrarı

**Sorun:** `PackResult` hem `src/types/canvas.ts:34` hem `src/services/packing.service.ts:4` içinde tanımlı.

**Files:**
- Modify: `src/services/packing.service.ts:1-9` — Lokal `PackResult` tanımını kaldır, `import { PackResult } from '@/types/canvas'` ekle

**Commit:** `refactor: deduplicate PackResult interface`

---

## Faz B: Güvenlik & Production Hardening

### B.1 PAYTR_TEST_MODE Production Guard

**Sorun:** `PAYTR_TEST_MODE` varsayılan `"1"` (test). Production'da unutulursa gerçek ödeme alınamaz.

**Files:**
- Modify: `src/lib/env.ts` — `productionRequiredSchema`'ya `PAYTR_TEST_MODE: z.literal("0")` ekle

**Commit:** `fix: enforce PAYTR_TEST_MODE=0 in production environment`

---

### B.2 İndirim Kodu Kullanıcı Bazlı Takip

**Sorun:** `DiscountCode.usedCount` global. Aynı kullanıcı aynı kodu birden fazla siparişte kullanabilir.

**Files:**
- Modify: `prisma/schema.prisma` — `DiscountUsage` modeli ekle (userId, discountCodeId, orderId, usedAt)
- Modify: `src/app/api/pricing/discount/route.ts` — Kullanıcı bazlı kontrol ekle
- Modify: `src/services/order.service.ts` — Sipariş oluşturulurken `DiscountUsage` kaydı oluştur

**Migration:** `npx prisma migrate dev --name add_discount_usage_tracking`

**Commit:** `feat: add per-user discount code usage tracking`

---

### B.3 DB Index Optimizasyonları

**Sorun:** Sık sorgulanan alanlarda index eksik.

**Files:**
- Modify: `prisma/schema.prisma` — Şu indexleri ekle:
  - `OtpCode` → `@@index([expiresAt])` (cron temizliği için)
  - `DiscountCode` → `@@index([isActive])` (aktif kod sorguları için)
  - `VerificationToken` → `@@index([identifier])` (şifre sıfırlama sorguları için)

**Migration:** `npx prisma migrate dev --name add_missing_indexes`

**Commit:** `perf: add missing database indexes for OtpCode, DiscountCode, VerificationToken`

---

## Faz C: Eksik Altyapı

### C.1 Cron Jobs (Zamanlanmış Görevler)

**Sorun:** Eski planın Faz 2.5 maddesi hiç uygulanmadı. Süresi dolmuş OTP'ler, terk edilmiş siparişler, eski draft'lar birikir.

**Files:**
- Create: `scripts/cron-worker.ts`
- Modify: `docker-compose.prod.yml` — `cron` servisi ekle
- Modify: `Dockerfile` — cron worker build target'ı ekle

**Görevler:**
- **OTP temizliği**: `expiresAt < now()` olan kayıtları sil (her 1 saat)
- **Terk edilmiş sipariş**: 24 saat+ `PENDING_PAYMENT` → `CANCELLED` (her 6 saat)
- **Süresi dolmuş draft**: 90 gün+ güncellenmemiş draft'ları sil (günlük)
- **E-fatura durum kontrolü**: `SENT_TO_GIB` durumundaki faturaları kontrol et (her 30 dk)
- **Süresi dolmuş VerificationToken temizliği**: `expires < now()` sil (günlük)

**Commit:** `feat: add cron worker for scheduled cleanup and monitoring tasks`

---

### C.2 Admin Yeni Sipariş Bildirimi

**Sorun:** Yeni sipariş geldiğinde admin'e bildirim gitmiyor.

**Yaklaşım:** En basit çözüm — sipariş oluşturulduğunda admin'e email gönder. Gerçek zamanlı bildirim (WebSocket/SSE) aşırı mühendislik olur.

**Files:**
- Modify: `src/services/order.service.ts` — Sipariş oluşturma sonrası admin email bildirimi ekle
- Create: Seed'de `ADMIN_NEW_ORDER` email template'i ekle (veya mevcut email template seeding'e ekle)

**Commit:** `feat: send email notification to admin on new orders`

---

## Faz D: UX İyileştirmeleri

### D.1 İletişim Sayfası Tamamlama

**Sorun:** Adres sadece "İstanbul, Türkiye", telefon numarası yok. Türk e-ticaret mevzuatı tam adres gerektirebilir.

**Files:**
- Modify: `src/app/(shop)/iletisim/page.tsx` — Tam adres ve telefon numarası ekle. (Gerçek bilgiler kullanıcıdan alınmalı)

**Not:** Gerçek adres ve telefon bilgisi kullanıcıdan sorulmalı.

**Commit:** `fix: add full address and phone number to contact page`

---

### D.2 Sosyal Medya Linkleri

**Sorun:** Footer ve iletişim sayfasındaki Instagram/Twitter/LinkedIn linkleri muhtemelen 404 veriyor.

**Files:**
- Modify: `src/components/layout/footer.tsx:33-56`
- Modify: `src/app/(shop)/iletisim/page.tsx:84-107`

**Yaklaşım:** SiteSettings'e sosyal medya URL alanları ekle. Veya gerçek hesaplar yoksa linkleri kaldır.

**Not:** Hangi sosyal medya hesaplarının aktif olduğu kullanıcıdan sorulmalı.

**Commit:** `fix: update or remove placeholder social media links`

---

### D.3 Skeleton Loading States

**Sorun:** Tüm loading state'ler sadece spinner. Admin dashboard, sipariş listesi gibi veri-yoğun sayfalarda skeleton loading UX'i iyileştirir.

**Files:**
- Modify: `src/app/admin/loading.tsx` — Skeleton layout (dashboard stats + chart + tablo)
- Modify: `src/app/admin/siparisler/loading.tsx` (create if not exists) — Tablo skeleton
- Modify: `src/app/(shop)/hesabim/siparislerim/loading.tsx` (create if not exists) — Sipariş listesi skeleton
- Modify: `src/app/(shop)/loading.tsx` — Skeleton layout

**Commit:** `feat: add skeleton loading states for data-heavy pages`

---

### D.4 Homepage Harici Video Bağımlılığı

**Sorun:** Hero bölümünde Pexels CDN'den video çekiliyor. Pexels çökerse veya video kaldırılırsa hero bozulur.

**Files:**
- Modify: `src/app/(standalone)/odeme/basarili/page.tsx:160` — Video dosyasını MinIO/S3'e yükle, URL'yi güncellle

**Not:** Video dosyası indirilip S3'e yüklenmeli.

**Commit:** `fix: host hero video on own S3 instead of external Pexels CDN`

---

## Faz E: Eski Plan Faz 5 (Nice-to-have)

### E.1 Analytics Entegrasyonu (GA4)

**Files:**
- Create: `src/components/analytics.tsx` — GA4 script component (cookie consent'e bağlı)
- Modify: `src/app/layout.tsx` — Analytics component'i ekle
- Modify: `src/app/(standalone)/odeme/basarili/page.tsx` — Conversion tracking event

**Commit:** `feat: add Google Analytics 4 integration with cookie consent`

---

### E.2 Sipariş Baskı Önizleme

**Sorun:** Checkout öncesi kullanıcı gang sheet'in nasıl görüneceğini göremez.

**Files:**
- Create: `src/components/checkout/print-preview-dialog.tsx`
- Modify: `src/app/(shop)/odeme/page.tsx` — Ödeme adımından önce önizleme dialog'u

**Commit:** `feat: add print preview dialog before checkout`

---

### E.3 Kargo Firması Entegrasyonu

**Sorun:** Takip kodu var ama kargo firması URL'i otomatik oluşturulmuyor.

**Files:**
- Modify: `prisma/schema.prisma` — `Order`'a `shippingProvider String?` ekle (eğer yoksa kontrol et)
- Create: `src/lib/shipping-providers.ts` — Kargo firması URL template'leri (Aras, Yurtiçi, MNG, PTT)
- Modify: `src/app/(shop)/hesabim/siparislerim/[orderNumber]/page.tsx` — "Kargom Nerede?" linki
- Modify: `src/app/admin/siparisler/[orderId]/page.tsx` — Kargo firması seçimi dropdown

**Commit:** `feat: add shipping provider selection and tracking URL generation`

---

### E.4 Gelişmiş Müşteri Sipariş Arama

**Sorun:** Müşteri sipariş listesinde filtreleme yok.

**Files:**
- Modify: `src/app/(shop)/hesabim/siparislerim/page.tsx` — Durum filtresi ve tarih aralığı ekle
- Modify: `src/app/api/orders/route.ts` — `status` ve `dateFrom/dateTo` query parametreleri ekle (eğer yoksa)

**Commit:** `feat: add order filtering by status and date range for customers`

---

## Özet Tablosu

| Faz | İçerik | Madde Sayısı | Öncelik |
|-----|--------|:------------:|---------|
| **Faz A** | Kod kalitesi & hata yönetimi | 5 | Yüksek |
| **Faz B** | Güvenlik & production hardening | 3 | Yüksek |
| **Faz C** | Eksik altyapı | 2 | Orta |
| **Faz D** | UX iyileştirmeleri | 4 | Orta |
| **Faz E** | Nice-to-have (eski Faz 5) | 4 | Düşük |
| **Toplam** | | **18** | |

---

## Kullanıcıdan Alınacak Bilgiler

Bu plan uygulanmadan önce şu bilgiler gerekli:

1. **İletişim bilgileri** — Gerçek adres ve telefon numarası nedir?
2. **Sosyal medya** — Hangi hesaplar aktif? Olmayanlar kaldırılsın mı?
3. **GA4** — Google Analytics Measurement ID (G-XXXXXXX) nedir?
4. **Teslimat süresi** — Sabit "2 İş Günü" mü kalacak, yoksa SiteSettings'ten yönetilsin mi?
5. **Video** — Pexels videosu S3'e mi taşınsın, yoksa farklı bir video mı kullanılsın?
