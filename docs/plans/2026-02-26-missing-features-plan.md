# DTF Baskıcım - Eksik Özellikler Uygulama Planı

> Tarih: 2026-02-26
> Durum: Onay bekliyor

---

## Faz 1: Kritik Hukuki & Veri Güvenliği

### 1.1 Sözleşme Kabul Kaydı
- `Order` modeline `termsAcceptedAt DateTime?` alanı ekle
- Sipariş oluşturma API'sinde (`POST /api/orders`) bu alanı kaydet
- Checkout formunda checkbox işaretlendiğinde timestamp gönder
- Migration oluştur

### 1.2 KVKK - Hesap Silme
- `DELETE /api/user/account` endpoint'i oluştur
- Kullanıcı verisini anonimleştir (ad, email, telefon → hash/placeholder)
- Aktif siparişi olan kullanıcılar silinemez (PROCESSING, SHIPPED durumunda engelle)
- Tamamlanmış siparişlerdeki fatura verileri 10 yıl saklanmalı (VUK zorunluluğu) → sadece kullanıcı profili anonimleştirilir
- `/hesabim/ayarlar` sayfasına "Hesabımı Sil" butonu + onay dialog'u ekle
- Silme sonrası oturumu kapat ve ana sayfaya yönlendir

### 1.3 Email Doğrulama
- `POST /api/auth/verify-email` endpoint'i oluştur
- Kayıt sonrası doğrulama emaili gönder (token bazlı, 24 saat geçerli)
- `/email-dogrula/[token]` sayfası oluştur
- Doğrulanmamış kullanıcılara uyarı banner'ı göster (hesabım sayfalarında)
- Sipariş verebilmek için email doğrulaması zorunlu mu? → Karar: zorunlu değil ama banner ile hatırlatma
- "Doğrulama emailini tekrar gönder" butonu

### 1.4 Yedekleme Stratejisi
- `scripts/backup-db.sh` oluştur (pg_dump, gzip, tarih bazlı dosya adı)
- `scripts/backup-s3.sh` oluştur (mc mirror veya rclone ile offsite kopya)
- Docker Compose'a `backup` servisi ekle (cron ile günlük çalışır)
- Backup'ları ayrı bir dizine veya remote storage'a kaydet
- Backup retention: 7 günlük, 4 haftalık, 3 aylık

### 1.5 Hardcoded Staging URL Temizliği
- `NEXT_PUBLIC_APP_URL` kullanımlarını `NEXT_PUBLIC_BASE_URL` ile birleştir
- Env schema'ya (`src/lib/env.ts`) ekle
- 6 dosyadaki hardcoded `ercanakcan.online` fallback'lerini kaldır
- Tek bir `getBaseUrl()` helper fonksiyonu oluştur (`src/lib/env.ts` veya `src/lib/utils.ts`)
- Email template'lerindeki hardcoded URL'leri de düzelt

### 1.6 PayTR Callback Hata Yönetimi
- DB hatalarında PayTR'ye `FAIL` dön (retry imkanı tanı)
- Idempotency kontrolü ekle: aynı `merchant_oid` ile tekrar gelen callback → `OK` dön
- `PaymentTransaction` tablosunda `paytrHash` veya `callbackProcessedAt` alanı ekle (duplicate kontrolü)
- Geçici hatalar (DB timeout, connection refused) vs kalıcı hatalar (validation fail) ayrımı yap

---

## Faz 2: Yüksek Öncelikli Kullanıcı Deneyimi

### 2.1 Telefon Girişli Kullanıcı Ad/Soyad Toplama
- OTP ile ilk giriş yapan kullanıcılar için onboarding akışı
- `/hesabim` sayfasına ilk girişte "Profilinizi tamamlayın" banner'ı göster
- Ad/soyad boş olan kullanıcılar sipariş veremez → checkout'ta validasyon ekle
- Alternatif: OTP giriş sonrası zorunlu ad/soyad modal'ı

### 2.2 Müşteriye Kargo Takip Kodu Gösterme
- `/api/orders/[orderNumber]` response'una `trackingCode` ve `shippingProvider` ekle
- Müşteri sipariş detay sayfasına kargo bilgisi bölümü ekle
- SHIPPED durumundaki siparişlerde takip kodu göster
- Opsiyonel: Kargo firması linki oluştur (Aras, Yurtiçi vb. için URL template)

### 2.3 Müşteri Sipariş İptali
- `POST /api/orders/[orderNumber]/cancel` endpoint'i oluştur
- Sadece `PENDING_PAYMENT` durumundaki siparişler iptal edilebilir
- `PROCESSING` durumundakiler için iptal talebi oluşturma (admin onayı gerekir)
- Müşteri sipariş detay sayfasına "İptal Et" butonu + onay dialog'u ekle
- İptal sonrası email/SMS bildirimi

### 2.4 Müşteri Fatura PDF (E-Fatura Olmadan)
- Kendi fatura PDF oluşturma servisi yaz (PDFKit ile, export PDF'e benzer)
- Fatura ISSUED durumundayken bile müşteri PDF indirebilsin
- `/api/orders/[orderNumber]/invoice/pdf` endpoint'ini güncelle: önce Trendyol PDF, yoksa kendi PDF
- Müşteri sipariş detay sayfasına "Faturayı İndir" butonu ekle

### 2.5 Zamanlanmış Görevler (Cron Jobs)
- `scripts/cron-worker.ts` oluştur veya mevcut export worker'a cron ekle
- **OTP temizliği**: `expiresAt < now()` olan kayıtları sil (her 1 saat)
- **Terk edilmiş sipariş temizliği**: 24 saat+ `PENDING_PAYMENT` + payment FAILED → CANCELLED yap (her 6 saat)
- **E-fatura durum kontrolü**: `SENT_TO_GIB` durumundaki faturaları GIB'den kontrol et (her 30 dk)
- **Süresi dolmuş draft temizliği**: 90 gün+ güncellenmemiş draft'ları sil (günlük)
- Docker Compose'da ayrı `cron` servisi veya mevcut worker'a entegre et

### 2.6 Sipariş Listesi Pagination
- `/api/orders` endpoint'ine `page`, `limit`, `status` parametreleri ekle
- Varsayılan: `page=1, limit=20`
- Müşteri sipariş sayfasını server-side pagination'a çevir
- Toplam sayfa sayısı response'a ekle

### 2.7 E-Fatura Provider Cache Reset
- `/api/admin/settings` PUT handler'ına `resetEFaturaProvider()` çağrısı ekle
- E-fatura ile ilgili alanlar değiştiğinde provider'ı sıfırla
- Sunucu restart'ı gerektirmeden credential değişikliği

---

## Faz 3: Güvenlik & Altyapı

### 3.1 Şifre Kuralları Güçlendirme
- Minimum 8 karakter
- En az 1 büyük harf, 1 küçük harf, 1 rakam zorunlu
- `src/validations/auth.ts` güncelle (regex ile)
- Kayıt ve şifre sıfırlama formlarında şifre gücü göstergesi ekle
- Mevcut kullanıcıları etkilemez, sadece yeni kayıt/şifre değişikliği için

### 3.2 Oturum Yönetimi UI
- `/api/user/sessions` endpoint'i oluştur (aktif session listesi)
- `/api/user/sessions/[id]` DELETE → oturumu sonlandır
- `/hesabim/ayarlar` sayfasına "Aktif Oturumlar" bölümü ekle
- Her oturum: cihaz, son aktivite tarihi, IP (opsiyonel)
- "Tüm oturumları kapat" butonu

### 3.3 Çerez Onayı İyileştirme
- Cookie banner'a "Reddet" butonu ekle
- Reddetme durumunda sadece zorunlu çerezler kullanılsın
- Tercihi DB'ye (veya cookie'ye) tarih damgasıyla kaydet
- Granüler kategori yönetimi (zorunlu / analitik / pazarlama)

### 3.4 Health Check Endpoint
- `GET /api/health` endpoint'i oluştur
- Kontroller: DB bağlantısı, Redis bağlantısı, S3 erişimi
- Response: `{ status: "ok", db: true, redis: true, s3: true, uptime: ... }`
- `docker-compose.prod.yml`'da app container'a healthcheck ekle
- Monitoring/alerting için kullanılabilir

### 3.5 Production Debug Log Temizliği
- `src/services/efatura/providers/trendyol.ts` satır 341, 356: `console.log` kaldır
- Hassas veri içeren log'ları temizle veya debug flag'ine bağla
- Opsiyonel: Yapılandırılmış loglama kütüphanesi (pino) ekle

### 3.6 API Rate Limiting Genişletme
- `POST /api/orders` → 10 sipariş/saat/kullanıcı
- `POST /api/cart` → 30/saat/kullanıcı
- `POST /api/addresses` → 20/saat/kullanıcı
- `POST /api/designs/drafts` → 20/saat/kullanıcı
- Mevcut `rate-limit.ts` altyapısını kullan

---

## Faz 4: Orta Öncelikli İyileştirmeler

### 4.1 Email/Telefon Değiştirme
- Email değiştirme: yeni email'e doğrulama linki gönder → doğrulama sonrası güncelle
- Telefon değiştirme: yeni numaraya OTP gönder → doğrulama sonrası güncelle
- `/hesabim/ayarlar` sayfasındaki disabled alanları düzenlenebilir yap
- Eski email/telefona bildirim gönder (güvenlik)

### 4.2 Şifre Değiştirme UI
- `/hesabim/ayarlar` sayfasına "Şifre Değiştir" bölümü ekle
- Mevcut şifre + yeni şifre + yeni şifre tekrar
- `PUT /api/user/password` endpoint'i oluştur
- Bcrypt ile mevcut şifre doğrulaması

### 4.3 Alt Grup Error/Loading Sayfaları
- `src/app/(shop)/error.tsx` → shop layout'lu hata sayfası
- `src/app/admin/error.tsx` → admin layout'lu hata sayfası
- `src/app/(auth)/loading.tsx` → auth sayfaları loading
- `src/app/(editor)/loading.tsx` → editör loading
- `src/app/(standalone)/loading.tsx` → standalone loading

### 4.4 Bildirim Tercihleri
- `User` modeline `emailOptIn Boolean @default(true)` ve `smsOptIn Boolean @default(true)` ekle
- `/hesabim/ayarlar` sayfasına bildirim tercihleri bölümü ekle
- Email gönderiminde `emailOptIn` kontrolü (transactional hariç)
- SMS gönderiminde `smsOptIn` kontrolü (transactional hariç)
- Email footer'a unsubscribe linki
- Kampanya SMS'i sadece opt-in kullanıcılara

### 4.5 İletişim Formu
- `/iletisim` sayfasına iletişim formu ekle (ad, email, konu, mesaj)
- `POST /api/contact` endpoint'i oluştur
- Form gönderimi → admin email'e bildirim
- Rate limit: 5 mesaj/saat/IP
- Opsiyonel: DB'ye `ContactMessage` modeli ile kaydet

### 4.6 Üretim Duraklatma Mekanizması
- `SiteSettings`'e `ordersPaused Boolean @default(false)` ve `ordersPausedMessage String?` ekle
- Admin ayarlarına "Sipariş almayı durdur" toggle'ı ekle
- Checkout sayfasında kontrol: durdurulmuşsa sipariş verilemesin
- Özel mesaj göster: "Tatil nedeniyle sipariş almıyoruz" gibi

---

## Faz 5: Düşük Öncelikli & Nice-to-have

### 5.1 Analytics Entegrasyonu
- Google Analytics 4 (GA4) script'i ekle (`layout.tsx`)
- Cookie onayı ile koşullu yükleme
- Temel event'ler: sayfa görüntüleme, sepete ekleme, sipariş tamamlama
- Conversion tracking: ödeme başarılı sayfasında

### 5.2 Sipariş Baskı Önizleme
- Checkout öncesi "Baskı Önizleme" adımı veya modal'ı
- Gang sheet layout'un küçültülmüş PNG görünümü
- Canvas'tan `toDataURL()` ile oluştur veya server-side thumbnail

### 5.3 Kargo Firması Entegrasyonu
- Kargo firması seçimi (Aras, Yurtiçi, MNG, PTT Kargo)
- Takip kodu girildiğinde otomatik kargo firması URL'i oluştur
- Müşteri sipariş detayında "Kargom Nerede?" linki
- İleri seviye: Kargo API entegrasyonu (otomatik durum güncelleme)

### 5.4 Gelişmiş Müşteri Sipariş Arama
- Müşteri sipariş listesinde tarih aralığı filtresi
- Durum filtresi
- Arama (sipariş no, ürün adı)

### 5.5 OTP Tablo Temizliği için DB Index
- `OtpCode` tablosuna `expiresAt` index'i ekle
- `DiscountCode` tablosuna `isActive` index'i ekle
- `VerificationToken` tablosuna `identifier` index'i ekle (şifre sıfırlama sorguları için)

---

## Uygulama Sırası Özeti

| Faz | İçerik | Tahmini Madde |
|-----|--------|---------------|
| **Faz 1** | Kritik hukuki & veri güvenliği | 6 madde |
| **Faz 2** | Yüksek öncelikli UX | 7 madde |
| **Faz 3** | Güvenlik & altyapı | 6 madde |
| **Faz 4** | Orta öncelikli iyileştirmeler | 6 madde |
| **Faz 5** | Düşük öncelikli & nice-to-have | 5 madde |
| **Toplam** | | **30 madde** |
