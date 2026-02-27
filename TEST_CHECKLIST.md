# DTF Baskıcım - Kapsamlı Test Kontrol Listesi

> Her maddeyi test edip yanına not alın. `[ ]` → `[x]` olarak işaretleyin.
> Sorun bulduğunuzda `[!]` ile işaretleyip yanına açıklama yazın.

---

## 1. Kimlik Doğrulama (Auth)

### 1.1 Email/Şifre ile Kayıt
- [ ] Yeni hesap oluşturma (geçerli bilgiler)
- [ ] Aynı email ile tekrar kayıt → hata mesajı
- [ ] Eksik alanlarla kayıt → validasyon hataları
- [ ] Çok kısa şifre → hata
- [ ] Geçersiz email formatı → hata
- [ ] Kayıt sonrası hoşgeldin emaili geldi mi?
- [ ] Kayıt sonrası otomatik giriş yapılıyor mu?

### 1.2 Email/Şifre ile Giriş
- [ ] Doğru bilgilerle giriş
- [ ] Yanlış şifre → hata mesajı
- [ ] Kayıtlı olmayan email → hata mesajı
- [ ] 10 başarısız deneme sonrası rate limit → engelleniyor mu?
- [ ] Giriş sonrası doğru sayfaya yönlendirme (callback URL)

### 1.3 Telefon OTP ile Giriş
- [ ] Geçerli telefon numarasına OTP gönderimi
- [ ] OTP SMS'i geliyor mu?
- [ ] Doğru OTP ile giriş
- [ ] Yanlış OTP ile deneme → hata
- [ ] 5 yanlış OTP denemesi → engel
- [ ] Süresi dolmuş OTP (5 dk sonra) → hata
- [ ] Aynı numaraya 3'ten fazla OTP/saat → rate limit

### 1.4 Google OAuth
- [ ] Google ile giriş → hesap oluşturma
- [ ] Mevcut Google hesabıyla tekrar giriş
- [ ] Google hesabı email'i zaten kayıtlıysa → hesap bağlama

### 1.5 Şifre Sıfırlama
- [ ] Şifremi unuttum → email gönderimi
- [ ] Reset linki çalışıyor mu?
- [ ] Yeni şifre ile giriş
- [ ] Süresi dolmuş token → hata
- [ ] Aynı token ile ikinci kullanım → hata
- [ ] Kayıtlı olmayan email → hata mesajı

### 1.6 Oturum Yönetimi
- [ ] Çıkış yapma
- [ ] 30 gün sonra oturum sona eriyor mu?
- [ ] Birden fazla sekmede oturum tutarlılığı
- [ ] Admin rolü doğru yükleniyor mu? (JWT callback)

---

## 2. Tasarım Editörü (Canvas)

### 2.1 Görsel Yükleme
- [ ] PNG yükleme
- [ ] JPEG yükleme
- [ ] TIFF yükleme
- [ ] WebP yükleme
- [ ] 50MB'dan büyük dosya → hata
- [ ] Desteklenmeyen format (SVG, GIF vb.) → hata
- [ ] Aynı anda birden fazla görsel yükleme
- [ ] Yükleme progress bar'ı çalışıyor mu?
- [ ] Yüklenen görsel S3'te doğru path'e gidiyor mu?
  - Üye: `uploads/{userId}/...`
  - Misafir: `uploads/guest/...`
- [ ] 20 yükleme/saat rate limit'i çalışıyor mu?

### 2.2 Manuel Mod (Sürükle-Bırak)
- [ ] Görseli canvas'a sürükleyip bırakma
- [ ] Görseli taşıma (drag)
- [ ] Görseli boyutlandırma (resize handles)
- [ ] Görseli döndürme (rotation)
- [ ] Birden fazla görseli canvas'a yerleştirme
- [ ] Görseli seçme ve silme
- [ ] "Tümünü Temizle" butonu
- [ ] Görseller arasında çakışma tespiti (overlapping)
  - [ ] 200'den fazla yerleşimde çakışma kontrolü atlıyor mu?
- [ ] Grid gösterimi açma/kapama
- [ ] Ruler gösterimi açma/kapama
- [ ] Grid'e yapışma (snap to grid)
- [ ] Canvas arka plan rengi değiştirme
- [ ] Zoom in/out çalışıyor mu?

### 2.3 Otomatik Mod (Auto-Pack)
- [ ] Görsellere adet girme
- [ ] "Otomatik Yerleştir" → skyline algoritması çalışıyor mu?
- [ ] Farklı boyutlu görseller doğru sığdırılıyor mu?
- [ ] Boşluk (gap) ayarı çalışıyor mu? (varsayılan 0.3cm)
- [ ] 90° döndürme optimizasyonu yapılıyor mu?
- [ ] Web Worker'da çalışıyor mu? (30 sn timeout)
- [ ] Çok sayıda görsel ile performans testi
- [ ] Auto-pack sonucu toplam yükseklik doğru hesaplanıyor mu?

### 2.4 Undo/Redo
- [ ] Yerleşim ekleme → Geri Al
- [ ] Yerleşim silme → Geri Al
- [ ] Taşıma → Geri Al
- [ ] Boyutlandırma → Geri Al
- [ ] İleri Al (Redo) çalışıyor mu?
- [ ] Maksimum history limiti

### 2.5 Taslak Kaydetme/Yükleme
- [ ] **Üye olarak:**
  - [ ] Yeni taslak kaydetme
  - [ ] Taslak adı verme
  - [ ] Taslak listesi görüntüleme
  - [ ] Kayıtlı taslağı yükleme
  - [ ] Taslağı silme
  - [x] Taslak güncelleme (üzerine kaydetme) _(Bug bulundu & düzeltildi: silinen draft güncellenmeye çalışılınca 404 → tüm sepet akışı kırılıyordu — `8bd0dd3`)_
  - [ ] Aktif taslak işareti doğru mu?
- [ ] **Misafir olarak:**
  - [ ] Taslak localStorage'a kaydediliyor mu?
  - [ ] Taslak yükleme
  - [ ] Taslak silme
  - [ ] Sayfa yenilendiğinde taslaklar korunuyor mu?

### 2.6 Canvas Persistance (IndexedDB)
- [ ] Canvas durumu sayfa yenilemesinde korunuyor mu?
- [ ] Yüklenen görseller (S3 URL'li) korunuyor mu?
- [ ] Blob URL'ler temizleniyor mu? (persist'te)
- [ ] Farklı sekmede açıldığında durum tutarlı mı?

### 2.7 Boyut ve Ölçü Hesaplamaları
- [ ] Rulo genişliği: 60cm toplam, 57cm baskı alanı
- [ ] DPI: 300 (118.11 px/cm)
- [ ] Export canvas genişliği: 6732px (57cm × 118.11)
- [ ] cm → px dönüşümü doğru mu?
- [ ] Toplam yükseklik hesabı doğru mu?
- [ ] Minimum sipariş: 0.3 metre

---

## 3. Sepet

### 3.1 Sepete Ekleme
- [x] Tasarımdan sepete ekleme _(Bug bulundu & düzeltildi: draft 404 hatası sepet akışını engelliyordu — `8bd0dd3`)_
- [ ] Sepete eklenen öğe doğru layout/items bilgisi taşıyor mu?
- [ ] Toplam metre hesabı doğru mu?
- [ ] Birden fazla gang sheet ekleme

### 3.2 Üye Sepeti
- [ ] Sepet veritabanında saklanıyor mu? (CartItem tablosu)
- [ ] Farklı cihazdan giriş yapınca sepet geliyor mu?
- [ ] Sepetten öğe silme
- [ ] Sepet boşken görünüm

### 3.3 Misafir Sepeti
- [ ] Sepet IndexedDB'de saklanıyor mu?
- [ ] Sayfa yenilemede sepet korunuyor mu?
- [ ] Sepetten öğe silme
- [ ] Ödeme sonrası sepet temizleniyor mu?

### 3.4 Edge Cases
- [ ] Boş sepetle ödemeye gitmeye çalışma → engel
- [ ] Çok uzun bir tasarım (yüksek metre) ile sepet
- [ ] Sepetteki öğe sayısı limiti var mı?

---

## 4. Ödeme (Checkout)

### 4.1 Adres Seçimi
- [ ] **Üye:** Kayıtlı adreslerden seçim
- [ ] **Üye:** Yeni adres ekleme (checkout sırasında)
- [ ] **Üye:** Varsayılan adres otomatik seçili mi?
- [ ] **Misafir:** Adres formu görünüyor mu?
- [ ] **Misafir:** Tüm zorunlu alanlar validasyonu
- [ ] Şehir/ilçe seçimi çalışıyor mu?

### 4.2 Fatura Bilgileri
- [ ] Bireysel fatura seçimi
- [ ] Kurumsal fatura seçimi
  - [ ] Firma adı, vergi dairesi, vergi numarası alanları
- [ ] "Farklı fatura adresi" toggle'ı
- [ ] Üye için kayıtlı fatura bilgisi otomatik yükleniyor mu?
- [ ] Ödeme sonrası fatura bilgisi profile kaydediliyor mu?

### 4.3 Fiyatlandırma Görünümü
- [ ] Ara toplam doğru mu?
- [ ] KDV (%20) doğru hesaplanıyor mu?
- [ ] Kargo ücreti doğru mu? (varsayılan 49.90 TL)
- [ ] Ücretsiz kargo eşiği (500 TL) çalışıyor mu?
- [ ] İndirim kodu uygulanıyor mu?
- [ ] Genel toplam doğru mu?

### 4.4 İndirim Kodu
- [ ] Geçerli yüzdelik indirim kodu
- [ ] Geçerli sabit tutar indirim kodu
- [ ] Süresi dolmuş kod → hata
- [ ] Kullanım limiti aşılmış kod → hata
- [ ] Minimum sipariş şartı sağlanmıyor → hata
- [ ] Geçersiz kod → hata mesajı

### 4.5 Mesafeli Satış Sözleşmesi
- [ ] Checkbox işaretlenmeden sipariş verilemez
- [ ] Sözleşme metni görüntülenebiliyor mu?

### 4.6 Kredi Kartı ile Ödeme (PayTR)
- [ ] PayTR iframe yükleniyor mu?
- [x] Başarılı ödeme → `/odeme/basarili` sayfası _(Bug bulundu & düzeltildi: metraj floating point olarak gösteriliyordu, ör: 2.15399999998 — `8bd0dd3`)_
- [ ] Başarısız ödeme → `/odeme/basarisiz` sayfası
- [ ] Callback HMAC doğrulaması çalışıyor mu?
- [ ] Tutar doğrulaması (kuruş cinsinden) çalışıyor mu?
- [ ] Test modunda çalışıyor mu? (`PAYTR_TEST_MODE=1`)
- [ ] Ödeme sonrası sipariş durumu PROCESSING'e geçiyor mu?
- [ ] Ödeme sonrası export queue'ya ekleniyor mu?
- [ ] Ödeme sonrası SMS gönderiliyor mu?
- [ ] Ödeme sonrası otomatik fatura oluşturuluyor mu?

### 4.7 Banka Havale ile Ödeme
- [ ] Banka havale seçeneği seçilebiliyor mu?
- [ ] `/odeme/banka-havale` sayfası doğru bilgileri gösteriyor mu?
- [ ] Sipariş PENDING_PAYMENT durumunda mı?
- [ ] IBAN ve banka bilgileri görünüyor mu?

### 4.8 Başarısız Ödeme Sonrası
- [ ] Başarısız ödeme sayfasında "Tekrar Dene" butonu
- [ ] `/api/payment/paytr/retry` çalışıyor mu?
- [ ] Sadece FAILED durumundaki siparişler için çalışıyor mu?

### 4.9 Misafir Checkout Edge Cases
- [ ] Misafir olarak tam checkout akışı (kayıt olmadan)
- [ ] Misafir bilgileri (email, ad, telefon) siparişe kaydediliyor mu?
- [ ] Misafir sepeti ödeme sonrası temizleniyor mu?

---

## 5. Sipariş Sistemi

### 5.1 Sipariş Oluşturma
- [ ] Sipariş numarası formatı: `DTF-YYMMDD-XXXXXX`
- [ ] Sipariş + OrderGangSheet + OrderItem tek transaction'da mı?
- [ ] Sipariş onay emaili gönderiliyor mu?
- [ ] İndirim kodu kullanım sayısı artıyor mu?
- [ ] Sunucu tarafında fiyat hesabı yapılıyor mu? (client manipülasyonu engeli)

### 5.2 Sipariş Durum Akışı
- [ ] PENDING_PAYMENT → PROCESSING (ödeme onayı sonrası)
- [ ] PROCESSING → SHIPPED (admin tarafından)
- [ ] SHIPPED → COMPLETED (admin tarafından)
- [ ] Herhangi durumdan → CANCELLED
- [ ] Her durum değişikliği OrderStatusHistory'ye kaydediliyor mu?
- [ ] `changedBy`, `note`, `eventType` alanları doğru mu?

### 5.3 Üye Sipariş Geçmişi
- [ ] `/hesabim/siparislerim` sipariş listesi doğru mu?
- [ ] Sipariş detay sayfası (`/hesabim/siparislerim/[orderNumber]`)
- [ ] Sipariş durumu doğru gösteriliyor mu?
- [ ] Fatura PDF indirme butonu çalışıyor mu?

### 5.4 Misafir Sipariş Takip
- [ ] `/siparis-takip` sayfası
- [ ] Sipariş numarası + email ile sorgulama
- [ ] Yanlış bilgi ile sorgulama → hata
- [ ] Rate limit: 30 sorgu/saat/IP

### 5.5 Yeniden Sipariş (Reorder)
- [ ] Geçmiş siparişi sepete tekrar ekleme
- [ ] Layout ve items bilgisi doğru aktarılıyor mu?
- [ ] Sadece üyeler için çalışıyor mu?

---

## 6. Fatura Sistemi

### 6.1 Fatura Oluşturma
- [ ] Sipariş için otomatik fatura oluşturma (PayTR callback'te)
- [ ] Admin panelinden manuel fatura oluşturma
- [ ] Fatura numarası formatı: `{PREFIX}-{YEAR}-{00000}`
- [ ] Atomik numara artışı (race condition yok)
- [ ] Satıcı bilgileri SiteSettings'ten alınıyor mu?
- [ ] Alıcı bilgileri sipariş fatura alanlarından mı?

### 6.2 Fatura Tipleri
- [ ] SATIS (satış) faturası
- [ ] IADE (iade) faturası (refund sırasında)

### 6.3 Fatura Durumları
- [ ] DRAFT → ISSUED → SENT_TO_GIB → ACCEPTED
- [ ] Reddedilen fatura: REJECTED durumu
- [ ] İptal edilen fatura: CANCELLED durumu

### 6.4 Fatura PDF
- [ ] PDF oluşturma/indirme çalışıyor mu?
- [ ] Trendyol PDF URL'si geçerli mi?
- [ ] Müşteri tarafından fatura indirme (`/api/orders/[orderNumber]/invoice/pdf`)

---

## 7. E-Fatura (Trendyol Entegrasyonu)

### 7.1 Kimlik Doğrulama
- [ ] Trendyol API'ye giriş (`/api/auth/signin`)
- [ ] Token `x-access-token` header'ından alınıyor mu?
- [ ] Token 50 dakika cache'leniyor mu?
- [ ] Token süresi dolunca yenileniyor mu?

### 7.2 E-Arşiv Fatura (B2C - Bireysel)
- [ ] Bireysel müşteriye e-arşiv fatura gönderimi
- [ ] Prefix: `DAP` (veya ayarlardaki değer)
- [ ] Tutarlar kuruş cinsinden gönderiliyor mu? (TL × 100)
- [ ] GIB'e başarılı gönderim
- [ ] Durum kontrolü (polling)

### 7.3 E-Fatura (B2B - Kurumsal)
- [ ] Vergi numarasıyla GIB kayıtlı mükellef sorgulaması
- [ ] Kayıtlı mükellefe e-fatura gönderimi
- [ ] Prefix: `DIP` (veya ayarlardaki değer)
- [ ] Kayıtlı olmayan mükelleflere e-arşiv gönderimi (fallback)
- [ ] GIB alias doğru alınıyor mu?

### 7.4 E-Fatura İptal
- [ ] E-arşiv fatura iptali çalışıyor mu?
- [ ] E-fatura iptali → sadece e-arşiv için API'den yapılabilir

### 7.5 Ortam Ayarları
- [ ] Test ortamı: `stage-apigateway.trendyolefaturam.com`
- [ ] Prodüksiyon: `apigateway.trendyolecozum.com`
- [ ] Mock provider (`EFATURA_USE_MOCK=true`) çalışıyor mu?

### 7.6 Edge Cases
- [ ] API bağlantı hatası → graceful error handling
- [ ] Geçersiz vergi numarası ile sorgulama
- [ ] Aynı faturayı iki kez GIB'e gönderme → engel

---

## 8. Export Sistemi (Tasarım Dışa Aktarma)

### 8.1 Export Tetikleme
- [ ] PayTR başarılı ödeme → otomatik export
- [ ] Admin sipariş durumunu PROCESSING'e alınca → otomatik export
- [ ] Admin sipariş detayından manuel export
- [ ] Toplu export (bulk action)
- [ ] Tek gang sheet export

### 8.2 Export Kalitesi
- [ ] PNG çıktısı doğru boyutlarda mı?
- [ ] PNG çözünürlük: 300 DPI
- [ ] TIFF çıktısı (LZW sıkıştırma)
- [ ] PDF çıktısı (cm-doğru sayfa boyutu)
- [ ] Şeffaf arka plan korunuyor mu?

### 8.3 Export Doğruluğu
- [ ] Görseller doğru konumda mı?
- [ ] Görseller doğru boyutta mı? (cm → px dönüşümü)
- [ ] Döndürülmüş görseller doğru açıda mı?
- [ ] Birden fazla gang sheet olan siparişte her biri ayrı export mi?

### 8.4 S3 Depolama
- [ ] Export dosyaları doğru path'e yükleniyor mu?
  - `exports/{orderId}/{gangSheetId}/gangsheet.png`
  - `exports/{orderId}/{gangSheetId}/gangsheet.tiff`
  - `exports/{orderId}/{gangSheetId}/gangsheet.pdf`
- [ ] Admin indirme URL'leri çalışıyor mu? (presigned, 1 saat)

### 8.5 Worker & Kuyruk
- [ ] BullMQ kuyruğu çalışıyor mu?
- [ ] Worker concurrency: 1 (bellek koruması)
- [ ] Failed job retry mekanizması
- [ ] Export durumu admin panelde görünüyor mu?
- [ ] `sharp.cache(false)` ve `sharp.concurrency(1)` ayarları

### 8.6 Edge Cases
- [ ] Çok büyük tasarım (yüksek metre) export'u
- [ ] Bozuk/eksik görsel ile export → hata yönetimi
- [ ] Export sırasında worker crash → recovery
- [ ] Aynı sipariş için tekrar export (üzerine yazma)

---

## 9. Admin Paneli

### 9.1 Dashboard
- [ ] Toplam gelir doğru mu?
- [ ] Aylık gelir doğru mu?
- [ ] Toplam sipariş sayısı
- [ ] Bekleyen sipariş sayısı
- [ ] 30 günlük gelir grafiği (Recharts)
- [ ] Son 10 sipariş tablosu
- [ ] En çok harcayan 5 müşteri

### 9.2 Sipariş Yönetimi
- [ ] Sipariş listesi filtreleme (durum, tarih, arama)
- [ ] Sipariş detay sayfası tam bilgi gösteriyor mu?
- [ ] Durum değiştirme dropdown
- [ ] Takip kodu girişi (SHIPPED durumunda)
- [ ] Admin notları ekleme
- [ ] Banka havalesi onaylama butonu
- [ ] Sipariş silme

### 9.3 Toplu İşlemler (Bulk Actions)
- [ ] Toplu "İşleme Al" (set_processing)
- [ ] Toplu export tetikleme
- [ ] Toplu fatura oluşturma

### 9.4 Müşteri Yönetimi
- [ ] Müşteri listesi
- [ ] Müşteri detay sayfası
- [ ] Müşterinin sipariş geçmişi
- [ ] Özel fiyatlandırma atama
- [ ] Özel fiyatlandırma silme

### 9.5 Fiyatlandırma Yönetimi
- [ ] Fiyat kademeleri oluşturma/düzenleme/silme
- [ ] minMeters ve maxMeters aralıkları çakışmıyor mu?
- [ ] İndirim kodu oluşturma (yüzdelik)
- [ ] İndirim kodu oluşturma (sabit tutar)
- [ ] İndirim kodu tarih aralığı
- [ ] İndirim kodu maksimum kullanım
- [ ] İndirim kodu minimum sipariş metresi
- [ ] İndirim kodu düzenleme/silme

### 9.6 İade İşlemi
- [ ] Kısmi iade (partial refund)
- [ ] Tam iade (full refund)
- [ ] İade tutarı > kalan bakiye → hata
- [ ] İade nedeni zorunlu mu?
- [ ] İade faturası oluşturma (opsiyonel)
- [ ] Tam iade sonrası sipariş durumu REFUNDED mı?
- [ ] Birden fazla kısmi iade (toplam kontrol)

### 9.7 Email Yönetimi
- [ ] Hoşgeldin template düzenleme
- [ ] Sipariş Onayı template düzenleme
- [ ] Kargoya Verildi template düzenleme
- [ ] Canlı önizleme (test verileriyle)
- [ ] Global email açma/kapama
- [ ] Template bazlı açma/kapama
- [ ] Template değişkenleri doğru render ediliyor mu?
  - `{musteriAdi}`, `{siparisNo}`, `{toplamTutar}`, `{takipKodu}`

### 9.8 SMS Yönetimi
- [ ] SMS template oluşturma/düzenleme
- [ ] Template tipleri: SIPARIS_ONAYLANDI, KARGOYA_VERILDI, KAMPANYA
- [ ] Toplu SMS gönderimi
- [ ] Müşteri telefon listesi
- [ ] SMS gönderim logları
- [ ] SMS açma/kapama toggle

### 9.9 Site Ayarları
- [ ] Fatura firma bilgileri (ad, adres, vergi no, IBAN)
- [ ] Firma logosu yükleme
- [ ] Fatura prefix ve sonraki numara ayarı
- [ ] E-fatura ortam seçimi (test/prod)
- [ ] E-fatura email/şifre ayarları
- [ ] E-arşiv prefix (`DAP`) ayarı
- [ ] E-fatura prefix (`DIP`) ayarı
- [ ] Fatura notları template'i
- [ ] Kargo ücreti ve ücretsiz kargo eşiği

### 9.10 Admin Erişim Kontrolü
- [ ] Admin olmayan kullanıcı → admin sayfalarına erişemez
- [ ] Admin API'leri yetkisiz istekte 401/403 döner
- [ ] Admin paneli sadece ADMIN rolüne açık mı?

---

## 10. Kullanıcı Hesabı

### 10.1 Profil
- [ ] Profil bilgilerini görüntüleme
- [ ] Ad, soyad, email, telefon güncelleme
- [ ] Firma adı, vergi numarası güncelleme

### 10.2 Şifre Değiştirme
- [ ] Mevcut şifre doğrulaması
- [ ] Yeni şifre ayarlama
- [ ] Yanlış mevcut şifre → hata

### 10.3 Adres Yönetimi
- [ ] Adres listeleme
- [ ] Yeni adres ekleme (tüm alanlar)
- [ ] Adres düzenleme
- [ ] Adres silme
- [ ] Varsayılan adres ayarlama
- [ ] Başka adresi varsayılan yapınca eski varsayılan kalkıyor mu?

### 10.4 Fatura Bilgileri
- [ ] Fatura bilgilerini görüntüleme
- [ ] Bireysel/Kurumsal geçişi
- [ ] Fatura bilgisi güncelleme
- [ ] Checkout'ta otomatik yükleniyor mu?

---

## 11. Fiyatlandırma Sistemi

### 11.1 Kademe Fiyatlandırma
- [ ] En yüksek eşleşen kademe uygulanıyor mu?
- [ ] Örnek: 0-1m = X TL, 1-5m = Y TL, 5+m = Z TL
- [ ] Kademe sınırlarındaki değerler (edge: tam 1.00m)

### 11.2 Özel Müşteri Fiyatlandırması
- [ ] Müşteriye özel fiyat kademe fiyatını override ediyor mu?
- [ ] Override kaldırılınca normal kademeye dönüyor mu?

### 11.3 KDV Hesabı
- [ ] KDV oranı: %20
- [ ] KDV formülü: (araToplam - indirim) × 0.20
- [ ] KDV dahil toplam doğru mu?

### 11.4 Kargo Ücreti
- [ ] Varsayılan: 49.90 TL
- [ ] Ücretsiz kargo eşiği: 500 TL (KDV dahil ürün toplamı)
- [ ] Eşik tam sınırda (500.00 TL) → ücretsiz mi?

### 11.5 Hesaplama Tutarlılığı
- [ ] Client tarafı hesaplama = Server tarafı hesaplama
- [ ] `/api/pricing/calculate` endpoint doğruluğu
- [x] Kuruş yuvarlama hataları var mı? _(`/odeme/basarili` sayfasında `.toFixed(2)` eksikti, düzeltildi — `8bd0dd3`)_

---

## 12. Dosya Depolama (MinIO/S3)

### 12.1 Upload
- [ ] Presigned POST URL oluşturma
- [ ] Doğrudan tarayıcıdan MinIO'ya yükleme
- [ ] Public URL (`S3_PUBLIC_URL`) doğru çalışıyor mu?
- [ ] Upload boyut limiti (50MB)

### 12.2 Download
- [ ] Admin export indirme (presigned GET, 1 saat)
- [ ] Fatura PDF indirme
- [ ] Süresi dolmuş URL → hata

### 12.3 Dosya Yapısı
- [ ] `uploads/` dizini kullanıcı görselleri
- [ ] `exports/` dizini export çıktıları
- [ ] `invoices/` dizini fatura PDF'leri

---

## 13. Email Sistemi

### 13.1 Email Gönderim Durumları
- [ ] Hoşgeldin emaili (kayıt sonrası)
- [ ] Sipariş onay emaili (sipariş oluşturma sonrası)
- [ ] Kargoya verildi emaili (SHIPPED durumuna geçince)
- [ ] Şifre sıfırlama emaili (her zaman gönderilir, toggle'dan bağımsız)

### 13.2 Email Kontrolleri
- [ ] Global email kapalıyken → hiçbir email gönderilmez (şifre sıfırlama hariç)
- [ ] Template bazlı kapama çalışıyor mu?
- [ ] SMTP bağlantı hatası → graceful handling

### 13.3 Template Değişkenleri
- [ ] `{musteriAdi}` doğru dolduruluyor mu?
- [ ] `{siparisNo}` doğru dolduruluyor mu?
- [ ] `{toplamTutar}` doğru dolduruluyor mu?
- [ ] `{takipKodu}` doğru dolduruluyor mu?
- [ ] DB'den template yükleme + fallback defaults

---

## 14. SMS Sistemi

### 14.1 Otomatik SMS
- [ ] Sipariş onayı SMS'i (ödeme sonrası)
- [ ] Kargoya verildi SMS'i (SHIPPED + takip kodu)

### 14.2 Manuel SMS
- [ ] Toplu kampanya SMS gönderimi
- [ ] Müşteri telefon listesi doğru mu?
- [ ] SMS log'ları kaydediliyor mu?

### 14.3 SMS Kontrolleri
- [ ] SMS açma/kapama toggle
- [ ] SMS kapalıyken gönderim engelleniyor mu?

---

## 15. SEO & Erişilebilirlik

### 15.1 SEO
- [ ] Sitemap (`/sitemap.xml`) doğru URL'leri içeriyor mu?
- [ ] Robots.txt doğru mu?
  - Allow: `/`
  - Disallow: `/api/`, `/admin/`, `/hesabim/`, `/odeme/`
- [ ] Sayfa başlıkları (title) doğru mu?
- [ ] Meta description'lar var mı?

### 15.2 Erişilebilirlik (Accessibility)
- [ ] Tüm icon-only butonlarda `aria-label` var mı?
- [ ] Form label'ları doğru bağlanmış mı?
- [ ] Klavye navigasyonu çalışıyor mu?
- [ ] Tab sırası mantıklı mı?
- [ ] Renk kontrastı yeterli mi?
- [ ] Screen reader ile test

---

## 16. Performans & Güvenlik

### 16.1 Rate Limiting
- [ ] Login: 10 deneme/saat/email
- [ ] OTP gönderim: 10/saat/IP, 3/saat/telefon
- [ ] OTP doğrulama: 10/saat/telefon
- [ ] Upload: 20/saat
- [ ] Sipariş takip: 30/saat/IP
- [ ] Rate limit aşılınca anlamlı hata mesajı

### 16.2 Güvenlik
- [ ] Admin API'leri yetkilendirme kontrolü
- [ ] HMAC doğrulaması (PayTR callback)
- [ ] Tutar doğrulaması (PayTR callback'te sipariş tutarı vs ödenen)
- [ ] SQL injection koruması (Prisma ORM)
- [ ] XSS koruması (React escape)
- [ ] CSRF koruması
- [ ] Şifre hashleme (bcrypt)

### 16.3 Performans
- [ ] Büyük sipariş listesi sayfalama (pagination)
- [ ] Canvas'ta çok sayıda görsel ile performans
- [ ] Export worker bellek kullanımı
- [ ] IndexedDB büyüklüğü zamanla şişiyor mu?
- [ ] S3 lifecycle rules aktif mi?

---

## 17. Sayfalar & Navigasyon

### 17.1 Genel Sayfalar
- [ ] Ana sayfa (`/`) doğru yükleniyor mu?
- [ ] Tasarım editörü (`/tasarim`)
- [ ] Sepet (`/sepet`)
- [ ] İletişim (`/iletisim`)
- [ ] Yardım (`/yardim`)

### 17.2 Hukuki Sayfalar
- [ ] Gizlilik Politikası (`/gizlilik-politikasi`)
- [ ] Kullanım Şartları (`/kullanim-sartlari`)
- [ ] Mesafeli Satış Sözleşmesi (`/mesafeli-satis-sozlesmesi`)
- [ ] İptal ve İade Politikası (`/iptal-ve-iade-politikasi`)
- [ ] Çerez Politikası (`/cerez-politikasi`)

### 17.3 Auth Sayfaları
- [ ] Giriş (`/giris`)
- [ ] Kayıt (`/kayit`)
- [ ] Şifremi Unuttum (`/sifremi-unuttum`)
- [ ] Şifre Sıfırlama (`/sifremi-sifirla/[token]`)

### 17.4 Responsive Tasarım
- [ ] Mobil görünüm (< 768px)
- [ ] Tablet görünüm (768-1024px)
- [ ] Desktop görünüm (> 1024px)
- [ ] Canvas editör mobilde kullanılabilir mi?
- [ ] Admin paneli mobilde kullanılabilir mi?
- [ ] Header mobil menü çalışıyor mu?
- [ ] Mobil sepet butonu çalışıyor mu?

### 17.5 Tema
- [ ] Light/Dark tema geçişi
- [ ] Tema tercihi sayfa yenilemesinde korunuyor mu?
- [ ] Tüm sayfalar her iki temada düzgün görünüyor mu?

---

## 18. Edge Cases & Genel

### 18.1 Eşzamanlılık (Concurrency)
- [ ] Aynı anda iki farklı sekmeden sipariş verme
- [ ] Aynı indirim kodunu eşzamanlı kullanma
- [ ] Aynı anda fatura oluşturma (numara çakışması olmamalı)
- [ ] Export worker aynı anda birden fazla job

### 18.2 Ağ Hataları
- [ ] İnternet kesildiğinde canvas durumu korunuyor mu?
- [ ] API hatalarında kullanıcıya anlamlı mesaj
- [ ] S3 erişilemezken upload/download
- [ ] Redis kapalıyken rate limiter davranışı
- [ ] SMTP kapalıyken email gönderim hatası → sipariş engellenmiyor mu?

### 18.3 Veri Tutarlılığı
- [ ] Sipariş oluşturma transaction rollback (hata durumunda)
- [ ] Fatura numarası atomik artışı
- [ ] Discount code kullanım sayacı tutarlılığı
- [ ] Silinen kullanıcının siparişleri ne oluyor?
- [ ] Silinen adresin siparişlerdeki referansı

### 18.4 Tarayıcı Uyumluluğu
- [ ] Chrome (en son)
- [ ] Firefox (en son)
- [ ] Safari (en son)
- [ ] Edge (en son)
- [ ] iOS Safari (mobil)
- [ ] Android Chrome (mobil)

---

## Notlar

_Test sırasında bulduğunuz sorunları buraya yazın:_

### Kritik Sorunlar
1.

### Orta Öncelikli Sorunlar
1. **[DÜZELTILDI]** "Taslak bulunamadı" hatası — Sepete Ekle'ye basıldığında, ürün sepete ekleniyor (201) ama ardından silinen/eski bir draft güncellenmeye çalışılıyor (404). Aynı try-catch içinde olduğu için toast.success + resetCanvas + router.push çalışmıyordu. **Fix:** Draft save/update kendi try-catch bloğuna sarıldı. (`price-bar.tsx` — `8bd0dd3`)

### Düşük Öncelikli Sorunlar
1. **[DÜZELTILDI]** Floating point gösterim hatası — `/odeme/basarili` sayfasında metraj `2.15399999999998 Metre` olarak gösteriliyordu. **Fix:** `.toFixed(2)` eklendi, birim `m` olarak kısaltıldı. (`page.tsx` — `8bd0dd3`)

### İyileştirme Önerileri
1.

---

> Son güncelleme: 2026-02-27
> Toplam test maddesi: ~300+
