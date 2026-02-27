# Şirket Bilgileri Güncelleme & Kod Kalitesi İyileştirmeleri - Tasarım

> Tarih: 2026-02-27
> Durum: Onaylandı

## Bağlam

Faz 1-4 tamamlandı. Bu tasarım, kalan eksiklikleri ve yeni keşfedilen sorunları kapsar. Cron jobs, admin bildirim, analytics, baskı önizleme, kargo entegrasyonu gibi büyük özellikler kapsam dışıdır — ayrı fazda ele alınacaktır.

---

## 1. Şirket Bilgileri & İletişim

### Gerçek Bilgiler
- **Marka adı:** DTF Baskıcım (değişmiyor)
- **Resmi ünvan:** Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti
- **Vergi No:** 4631210209
- **Adres:** Güzelyalı Burgaz Mahallesi Kazım Karabekir Caddesi No:13/C Mudanya/Bursa
- **Instagram:** https://instagram.com/dtf.baskicim (tek sosyal medya)
- **Telefon:** Yok (eklenmeyecek)
- **Banka hesap adı:** Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti

### Değişecek Yerler

**Adres güncellemesi (2 dosya):**
- `src/app/(shop)/iletisim/page.tsx:57` — "İstanbul, Türkiye" → tam Bursa adresi
- `src/app/(shop)/mesafeli-satis-sozlesmesi/page.tsx:31` — "İstanbul, Türkiye" → tam Bursa adresi

**Legal ünvan güncellemesi:**
- `src/app/(shop)/mesafeli-satis-sozlesmesi/page.tsx:28` — "Ünvan: DTF Baskıcım" → "Ünvan: Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti"
- Vergi No satırı eklenir
- `src/app/(shop)/kullanim-sartlari/page.tsx:134` — "İstanbul Mahkemeleri" → "Bursa Mahkemeleri"

**Banka hesap adı:**
- `src/lib/env.ts:38` — default "DTF Baskıcım" → "Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti"
- `src/lib/constants.ts:43` — fallback güncellenir
- `.env.example:34` — güncellenir

**Sosyal medya (7 yer):**
- Twitter ve LinkedIn linkleri kaldırılır
- Instagram linki `https://instagram.com/dtf.baskicim` olarak güncellenir
- Etkilenen dosyalar: `footer.tsx`, `iletisim/page.tsx`, `testimonials-section.tsx`

**E-fatura city fallback:**
- `src/services/efatura/providers/trendyol.ts:265` — "Istanbul" → "Bursa"

**Marka adı (DTF Baskıcım) DEĞİŞMEZ:** Header, footer, email template, SMS, auth sayfaları — hep aynı kalır.

---

## 2. Hardcoded Değer Düzeltmeleri

**Copyright "2025" → dinamik (3 yer):**
- `src/app/(standalone)/odeme/basarili/page.tsx:363`
- `src/app/api/admin/email-templates/route.ts:134`
- `src/app/api/admin/email-templates/route.ts:251`

---

## 3. Sessiz Hata Yutma → Bağlama Özel Toast Mesajları

28+ yerde `// silent` catch bloklarına bağlama özel Türkçe toast mesajları eklenir:

| Dosya | Mesaj |
|-------|-------|
| `hesabim/ayarlar/page.tsx` (profil) | "Profil bilgileri yüklenemedi" |
| `hesabim/ayarlar/page.tsx` (adresler) | "Adresler yüklenemedi" |
| `hesabim/ayarlar/page.tsx` (oturumlar) | "Aktif oturumlar yüklenemedi" |
| `hesabim/page.tsx` | "Profil bilgileri yüklenemedi" |
| `hesabim/siparislerim/page.tsx` | "Siparişler yüklenemedi" |
| `hesabim/siparislerim/[orderNumber]/page.tsx` | "Sipariş detayları yüklenemedi" |
| `odeme/page.tsx` | "Sayfa verileri yüklenemedi" |
| `admin/layout.tsx` | "Ayarlar yüklenemedi" |
| `admin/page.tsx` | "Dashboard verileri yüklenemedi" |
| `admin/email/page.tsx` | "Email şablonları yüklenemedi" |
| `admin/sms/page.tsx` | "SMS kayıtları yüklenemedi" |
| `admin/ayarlar/page.tsx` | "Ayarlar yüklenemedi" |
| `admin/siparisler/page.tsx` | "Siparişler yüklenemedi" |
| `admin/siparisler/[orderId]/page.tsx` | "Sipariş detayları yüklenemedi" |
| `admin/fiyatlandirma/page.tsx` | "Fiyat bilgileri yüklenemedi" |
| `admin/musteriler/page.tsx` | "Müşteri listesi yüklenemedi" |
| `admin/musteriler/[id]/page.tsx` | "Müşteri bilgileri yüklenemedi" |
| `order-transactions.tsx` | "İşlem geçmişi yüklenemedi" |
| `order-invoice-card.tsx` | "Fatura bilgileri yüklenemedi" |

Store'lar (cart-store, draft-store) → `console.warn()` eklenir.
idb-storage.ts → dokunulmaz.

---

## 4. console.log Temizliği

- `sms.service.ts:200,208,214,246` → kaldır
- `packing.service.ts:308` → kaldır
- `paytr/callback/route.ts:140` → `console.error`
- Mock provider ve DEV-only guard'lı → dokunulmaz

---

## 5. PackResult Interface Tekrarı

- `packing.service.ts` lokal tanım kaldırılır → `import { PackResult } from '@/types/canvas'`

---

## 6. Eksik Error Boundary'ler

- `src/app/(shop)/error.tsx` — mevcut root pattern + "Ana Sayfa'ya Dön" linki
- `src/app/admin/error.tsx` — mevcut root pattern + "Dashboard'a Dön" linki

---

## 7. PAYTR_TEST_MODE Production Guard

- `src/lib/env.ts` productionRequiredSchema'ya `PAYTR_TEST_MODE: z.literal("0")` eklenir

---

## 8. Skeleton Loading States

- Admin dashboard, sipariş listesi, müşteri listesi loading.tsx dosyalarına skeleton shimmer eklenir
- Mevcut spinner'lar yerine tablo/card placeholder'lar

---

## 9. DB Index Optimizasyonları

- `OtpCode` → `@@index([expiresAt])`
- `DiscountCode` → `@@index([isActive])`
- `VerificationToken` → `@@index([identifier])`

---

## 10. İndirim Kodu Kullanıcı Bazlı Takip

- `DiscountUsage` modeli: userId, discountCodeId, orderId, usedAt
- Sipariş oluşturulurken kayıt, indirim kontrolünde kullanıcı bazlı kontrol

---

## 11. Hero Video

- Pexels'tan endüstriyel DTF makinesi videosu bulunur
- MinIO/S3'e yüklenir
- `src/app/page.tsx:107` ve `odeme/basarili/page.tsx:160` URL'leri güncellenir
