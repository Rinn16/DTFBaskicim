# DTF Baskıcım - Proje Detayları

## Genel Bakış

**DTF Baskıcım**, müşterilerin tasarımlarını yükleyip 60cm genişliğindeki sanal bir DTF (Direct-to-Film) rulo üzerinde düzenleyebildiği, sipariş verebildiği ve profesyonel DTF baskı hizmeti alabildiği bir e-ticaret platformudur.

Platform; tasarım yükleme, gang sheet düzenleme, ödeme, otomatik dışa aktarma (PNG/TIFF/PDF), faturalama ve e-fatura entegrasyonu dahil olmak üzere uçtan uca iş akışını yönetir.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16 + React 19 + Tailwind CSS |
| State Management | Zustand (IndexedDB persistence) |
| Tasarım Editörü | Fabric.js 7 |
| Backend | Next.js API Routes + NextAuth v5 |
| Veritabanı | PostgreSQL 16 + Prisma 7 ORM |
| Kuyruk Sistemi | Redis 7 + BullMQ |
| Dosya Depolama | MinIO (S3 uyumlu) |
| Görüntü İşleme | Sharp + PDFKit |
| Ödeme | PayTR |
| SMS | VatanSMS API |
| E-Fatura | Trendyol E-Faturam API |
| Deployment | Docker Compose (5 servis) |

---

## Özellikler

### 1. Tasarım Editörü (`/tasarim`)

Müşterilerin tasarımlarını yükleyip düzenleyebildiği interaktif bir gang sheet editörü.

- **Görüntü Yükleme**: PNG, JPG, TIFF, WebP formatları desteklenir (maks. 50MB)
- **Sürükle-Bırak Yerleştirme**: Fabric.js tabanlı kanvas üzerinde tasarımları sürükle-bırak ile konumlandırma
- **Otomatik Yerleştirme (Auto-Pack)**: Skyline Bottom-Left algoritması ile otomatik yerleştirme
  - 4 farklı sıralama stratejisi dener (alan, yükseklik, genişlik, rastgele)
  - En az yükseklik veren sonucu seçer
  - 0° ve 90° rotasyon desteği
  - Web Worker'da çalışır (UI'ı bloklamaz), 30 saniye timeout ile sync fallback
- **Manuel Yerleştirme**: Tasarımları elle konumlandırma, boyutlandırma ve döndürme
- **Boyut Kontrolü**: cm cinsinden genişlik/yükseklik ayarlama, en-boy oranı kilitleme
- **Çoğaltma**: Aynı tasarımdan birden fazla kopya ekleme
- **Grid & Snap**: Hizalama ızgarası ve snap-to-grid özelliği
- **Cetvel**: cm cinsinden cetvel gösterimi
- **Boşluk Ayarı**: Tasarımlar arası boşluk (varsayılan 0.3cm)
- **Anlık Fiyat Hesaplama**: Yerleştirme değiştikçe toplam metre ve fiyat anlık güncellenir
- **Çakışma Tespiti**: Üst üste binen tasarımlar görsel olarak işaretlenir (AABB collision detection)
- **Taslak Kaydetme**: Kanvas durumu taslak olarak kaydedilip daha sonra yüklenebilir
- **IndexedDB Persistence**: Büyük tasarım durumları IndexedDB'de saklanır (localStorage 5MB limitini aşmamak için)

### 2. Sepet Sistemi (`/sepet`)

- **Misafir Sepeti**: Giriş yapmadan IndexedDB'de yerel olarak saklanan sepet
- **Üye Sepeti**: API destekli, sunucu tarafında saklanan sepet
- **Otomatik Geçiş**: Giriş yapıldığında misafir sepet öğeleri üye sepetine aktarılabilir
- **Miktar Güncelleme**: Sepet içinde adet değişikliği

### 3. Ödeme Sistemi (`/odeme`)

İki adımlı ödeme akışı:

**Adım 1 - Adres & Fatura Bilgileri:**
- Kayıtlı kullanıcılar için önceden doldurulmuş fatura bilgileri
- Kayıtlı adres seçimi veya yeni adres girişi
- Misafir kullanıcılar için ad, e-posta, telefon ve adres formu
- Fatura türü seçimi:
  - **Bireysel**: Ad, soyad, isteğe bağlı TC kimlik no (11 hane)
  - **Kurumsal**: Şirket adı, vergi dairesi, vergi numarası (10-11 hane)

**Adım 2 - Ödeme:**
- **Kredi Kartı**: PayTR iframe entegrasyonu
- **Banka Havalesi**: Banka bilgileri sayfasına yönlendirme

**Sunucu Tarafı Fiyat Doğrulama:**
- Fiyatlar sunucu tarafında yeniden hesaplanır (istemci tarafı manipülasyona karşı koruma)
- İndirim kodu doğrulaması (tarih aralığı, kullanım limiti, minimum tutar)
- Kargo ücreti hesaplaması (ücretsiz kargo eşiği)

### 4. Kimlik Doğrulama

Üç farklı giriş yöntemi:

- **E-posta + Şifre**: Klasik kayıt ve giriş (bcrypt hash, saat başı 10 deneme rate limit)
- **Telefon OTP**: SMS ile 6 haneli doğrulama kodu (5 deneme hakkı, 5 dakika geçerlilik)
- **Google OAuth**: Tek tıkla Google ile giriş (ilk girişte otomatik hesap oluşturma)

Kayıt sayfası: Ad, soyad, e-posta, şifre, şifre tekrarı ile kayıt.

### 5. Sipariş Yönetimi

**Müşteri Tarafı (`/hesabim/siparislerim`):**
- Sipariş listesi ve detay görüntüleme
- Görsel 4 adımlı durum takibi (zaman damgası ile)
- Fiyat dökümü ve ürün boyutları listesi
- Teslimat adresi bilgisi
- "Tekrar Sipariş Ver" butonu (öğeleri sepete kopyalar)

**Misafir Sipariş Takibi (`/siparis-takip`):**
- Sipariş numarası + telefon/e-posta ile sorgulama

**Sipariş Numarası Formatı**: `DTF-YYMMDD-XXXXXX`

**Sipariş Durumları**: Beklemede → İşleniyor → Kargoya Verildi → Teslim Edildi / İptal / İade

### 6. Gang Sheet Dışa Aktarma (Export)

BullMQ kuyruğu ile asenkron dışa aktarma işlemi:

- **PNG**: Sıkıştırma seviyesi 2 (web önizleme)
- **TIFF**: LZW sıkıştırma (baskı üretimi için)
- **PDF**: PDFKit ile cm→point dönüşümü (arşiv amaçlı)
- Her gang sheet için 3 format ayrı ayrı S3'e yüklenir
- Sipariş PROCESSING durumuna geçtiğinde otomatik tetiklenir
- Export worker ayrı bir Docker container'da çalışır (2GB RAM, concurrency 1)
- Graceful shutdown desteği (SIGINT/SIGTERM)

### 7. Fatura Sistemi

- **Otomatik Fatura Oluşturma**: Ödeme onaylandığında otomatik fatura oluşturulur
- **Fatura Numarası Atomikliği**: `SELECT ... FOR UPDATE` ile eşzamanlı isteklerde çakışma önlenir
- **Satıcı/Alıcı Anlık Görüntüsü**: Fatura oluşturulduğunda tüm satıcı ve alıcı bilgileri snapshot olarak kaydedilir
- **Fatura Türleri**: Satış faturası ve iade faturası
- **Fatura Durumları**: Taslak → Düzenlendi → GİB'e Gönderildi → Kabul Edildi / Reddedildi / İptal Edildi
- **PDF Oluşturma**: Fatura verilerinden PDF üretimi

### 8. E-Fatura Entegrasyonu

Trendyol E-Faturam API üzerinden GİB entegrasyonu:

- **Otomatik Yönlendirme**: Alıcının vergi numarası ile GİB mükellefiyet sorgusu yapılır
  - Kayıtlı B2B mükellefi → **e-Fatura** (TEMELFATURA)
  - Kayıtsız / B2C → **e-Arşiv Fatura** (EARSIVFATURA)
- **JWT Kimlik Doğrulama**: 50 dakikalık token önbellekleme
- **Ön Ek Yönetimi**: e-Arşiv = `DAP`, e-Fatura = `DIP` (ayarlardan değiştirilebilir)
- **Test/Production Ortamı**: Ayarlardan ortam seçimi
- **Fatura İptal**: GİB üzerinden fatura iptal etme
- **Durum Sorgulama**: GİB fatura durumu kontrolü

### 9. Admin Paneli

#### Dashboard (`/admin`)
- Toplam ciro, aylık ciro, toplam sipariş, bekleyen sipariş kartları
- Son 30 günlük gelir grafiği (Recharts)
- En çok harcayan müşteriler tablosu
- Son siparişler tablosu

#### Sipariş Yönetimi (`/admin/siparisler`)
- Sayfalanmış, aranabilir ve filtrelenebilir sipariş listesi
- Detaylı sipariş görüntüleme:
  - **Durum Güncelleme**: Sipariş durumu değiştirme
  - **Kargo İşlemleri**: Takip kodu girişi, sevk irsaliyesi oluşturma
  - **Fatura İşlemleri**: Fatura oluşturma, e-fatura gönderme, iptal etme, durum kontrolü
  - **İade İşlemleri**: İade ve iptal yönetimi
  - **Gang Sheet Kartları**: Her sheet için ayrı dışa aktarma/indirme
  - **Fiyat Dökümü**: Detaylı fiyat analizi
  - **Ödeme İşlemleri Zaman Çizelgesi**: Tüm ödeme hareketleri
  - **Müşteri & Teslimat Bilgileri**: Yan panelde özet bilgiler

#### Fiyatlandırma (`/admin/fiyatlandirma`)
- **Fiyat Kademeleri**: Metre bazlı fiyatlandırma (ör. 0-1m: X₺/m, 1-5m: Y₺/m)
- **İndirim Kodları**: Yüzde veya sabit tutar indirimi, geçerlilik tarihi, maksimum kullanım sayısı, minimum sipariş tutarı
- **Kargo Ayarları**: Kargo ücreti ve ücretsiz kargo eşiği

#### Müşteri Yönetimi (`/admin/musteriler`)
- Sayfalanmış, aranabilir müşteri listesi (ad/e-posta/telefon)
- Sipariş sayısı, toplam harcama, özel fiyatlandırma rozeti
- CSV dışa aktarma

#### Site Ayarları (`/admin/ayarlar`)
- **SMS Ayarları**: Global açma/kapama
- **E-posta Ayarları**: Global açma/kapama + etkinlik bazlı (hoş geldin, sipariş onayı, kargoya verildi)
- **Fatura Şirket Bilgileri**: Şirket adı, vergi no, vergi dairesi, adres, IBAN, web sitesi, logo yükleme
- **Fatura Numaralama**: Ön ek ve mevcut sayaç
- **Fatura Notları**: Şablon desteği (`{siparisNo}`, `{faturaNo}` değişkenleri)
- **E-Fatura Ayarları**: Ortam (test/production), e-posta, şifre, e-arşiv ve e-fatura ön ekleri

### 10. Bildirim Sistemi

**SMS Bildirimleri (VatanSMS):**
- Sipariş onayı SMS'i
- Kargoya verildi SMS'i (takip kodu ile)
- OTP doğrulama SMS'i
- Şablon bazlı: `{musteriAdi}`, `{siparisNo}`, `{toplamTutar}`, `{takipKodu}` değişkenleri
- SmsLog tablosunda kayıt tutma

**E-posta Bildirimleri (Nodemailer):**
- Hoş geldin e-postası
- Sipariş onayı e-postası
- Kargoya verildi e-postası
- DB'den yüklenen HTML şablonlar, değişken desteği
- Etkinlik bazlı açma/kapama

### 11. Ödeme İşlemleri

**PayTR Entegrasyonu:**
- PayTR iframe ile kredi kartı ödemesi
- HMAC-SHA256 imza doğrulama
- Idempotent webhook işleme
- Başarılı ödemede: sipariş → İŞLENİYOR, ödeme → TAMAMLANDI, sepet temizleme, export kuyruğa alma, SMS gönderme, otomatik fatura oluşturma
- Başarısız ödemede: sipariş silme

**Banka Havalesi:**
- Banka bilgileri gösterimi ile havale talimatı

**Ödeme İşlemleri Kaydı:**
- Her ödeme olayı `PaymentTransaction` tablosunda saklanır
- Türler: PAYMENT, REFUND, PARTIAL_REFUND, CHARGEBACK

---

## Veritabanı Modelleri

| Model | Açıklama |
|-------|----------|
| User | Kullanıcılar (çoklu auth: e-posta, telefon, Google) |
| Order | Siparişler (misafir + üye, fiyat, durum, ödeme, fatura bilgileri snapshot) |
| OrderItem | Sipariş kalemleri (açıklama, adet, birim fiyat, boyutlar) |
| OrderGangSheet | Gang sheet dışa aktarma takibi (PNG/TIFF/PDF S3 anahtarları) |
| OrderStatusHistory | Sipariş durum geçmişi (audit trail) |
| Invoice | Faturalar (satıcı/alıcı snapshot, kalemler, GİB bilgileri) |
| PaymentTransaction | Ödeme hareketleri |
| PricingTier | Metre bazlı fiyat kademeleri |
| CustomerPricing | Müşteriye özel fiyatlandırma |
| DiscountCode | İndirim kodları |
| ShippingConfig | Kargo ayarları |
| SiteSettings | Site geneli ayarlar (tekil kayıt) |
| DesignDraft | Tasarım taslakları |
| CartItem | Üye sepet öğeleri |
| SmsTemplate | SMS şablonları |
| SmsLog | SMS gönderim kayıtları |
| EmailTemplate | E-posta şablonları |

---

## Deployment Mimarisi

Docker Compose ile 5 servis:

| Servis | İmaj | RAM | Açıklama |
|--------|-------|-----|----------|
| `dtf-app` | Next.js (custom) | 1GB | Ana uygulama (port 3000) |
| `dtf-worker` | Next.js (custom) | 2GB | Export worker (gang sheet işleme) |
| `dtf-postgres` | postgres:16-alpine | 512MB | Veritabanı |
| `dtf-redis` | redis:7-alpine | 512MB | Kuyruk + rate limiting (AOF persistence) |
| `dtf-minio` | minio/minio | 512MB | S3 uyumlu dosya depolama (console: 9001) |

---

## Güvenlik Önlemleri

- **Rate Limiting**: Redis INCR + EXPIRE sliding window (giriş: 10/saat, yükleme: 20/saat)
- **HMAC-SHA256**: PayTR webhook imza doğrulama
- **Sunucu Tarafı Fiyat Hesaplama**: İstemci tarafı manipülasyona karşı koruma
- **Edge Middleware**: Route bazlı yetkilendirme (NextAuth JWT)
- **Admin Koruması**: `/admin/*` ve `/api/admin/*` rotaları rol kontrolü
- **Bcrypt**: Şifre hashleme
- **Presigned URL**: S3 dosya yükleme için imzalı URL (5 dakika geçerlilik)

---

## Sabitler

| Sabit | Değer | Açıklama |
|-------|-------|----------|
| Rulo Genişliği | 60 cm | Fiziksel rulo genişliği |
| Baskı Alanı | 57 cm | Yazdırılabilir alan |
| DPI | 300 | Çözünürlük |
| PX/CM | ~118.11 | Piksel/cm oranı |
| Kanvas Genişliği | 6732 px | 57cm × PX_PER_CM |
| KDV Oranı | %20 | Vergi oranı |
| Min. Sipariş | 0.3 metre | Minimum sipariş miktarı |
| Maks. Yükleme | 50 MB | Dosya boyutu limiti |
| Desteklenen Formatlar | PNG, JPG, TIFF, WebP | Yükleme formatları |

---

## Dizin Yapısı

```
├── prisma/                    # Veritabanı şeması ve migration'lar
├── public/workers/            # Web Worker'lar (packing algoritması)
├── scripts/
│   └── export-worker.ts       # BullMQ export worker
├── src/
│   ├── app/
│   │   ├── (auth)/            # Giriş ve kayıt sayfaları
│   │   ├── (shop)/            # Mağaza sayfaları (tasarım, sepet, ödeme, hesap)
│   │   ├── admin/             # Admin paneli sayfaları
│   │   ├── api/               # API rotaları
│   │   └── page.tsx           # Ana sayfa (landing)
│   ├── components/            # React bileşenleri
│   ├── generated/prisma/      # Prisma client (otomatik üretilmiş)
│   ├── hooks/                 # Özel React hook'ları
│   ├── lib/                   # Yardımcı fonksiyonlar (auth, db, s3, queue, rate-limit)
│   ├── services/              # İş mantığı servisleri
│   │   ├── efatura/           # E-fatura entegrasyonu
│   │   ├── export.service.ts  # Gang sheet dışa aktarma
│   │   ├── invoice.service.ts # Fatura servisi
│   │   ├── order.service.ts   # Sipariş servisi
│   │   ├── packing.service.ts # Otomatik yerleştirme algoritması
│   │   ├── paytr.service.ts   # PayTR ödeme entegrasyonu
│   │   ├── pricing.service.ts # Fiyatlandırma hesaplama
│   │   └── sms.service.ts     # SMS gönderim servisi
│   ├── stores/                # Zustand state yönetimi
│   ├── types/                 # TypeScript tipleri
│   └── validations/           # Zod doğrulama şemaları
├── docker-compose.prod.yml    # Production Docker Compose
├── Dockerfile                 # Multi-stage Docker build
└── package.json
```
