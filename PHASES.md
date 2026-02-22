# DTF Baskicim - Gelistirme Asamalari

> Bu dosya tum implementation phaselerini ve ilerleme durumunu icerir.
> Son guncelleme: 2026-02-20

---

## Phase 1: Foundation ✅ TAMAMLANDI

**Hedef:** Proje iskeleti, veritabani, auth, dosya yukleme, temel layout.

- [x] Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- [x] `docker-compose.yml` — PostgreSQL 16, Redis 7, MinIO
- [x] Prisma 7 schema + seed (fiyat kademeleri, admin kullanici)
- [x] NextAuth.js v5 — Email+Password (bcrypt), Google OAuth, Phone+OTP
- [x] Auth sayfalari: `/giris` (login), `/kayit` (register)
- [x] `proxy.ts` ile route korumasi (customer vs admin)
- [x] S3/MinIO presigned URL upload akisi
- [x] Layout componenti: header, footer

---

## Phase 2: Canvas / Tasarim Sayfasi ✅ TAMAMLANDI

**Hedef:** 57cm genislikte rulo canvas, manuel + otomatik yerlestirme, canli fiyatlandirma.

- [x] Fabric.js v7 canvas wrapper (`roll-canvas.tsx`) — 57cm genislik, dikey scroll
- [x] Tasarim sidebar: gorsel yukleme (drag-drop) + yuklenen gorseller listesi
- [x] Manuel yerlestirme: gorseli tiklayip canvas'a ekle, surukle
- [x] Bin-packing servisi: NFDH (Next Fit Decreasing Height) shelf algoritmasi
- [x] Otomatik yerlestirme dialog: tasarim basi adet girisi, yerlestir butonu
- [x] Zustand canvas store: yuklenen gorseller, placementlar, mod, hesaplamalar
- [x] Canli fiyat gosterimi: toplam metre, kademe gostergesi, fiyat dokumu
- [x] Canvas toolbar: secili sil, tumu temizle
- [x] Sol kenarda CM cetveli
- [x] DPI badge (sidebar) + DPI bilgi kutusu (canvas)
- [x] Fabric.js v7 originX/Y fix (center -> left/top)
- [x] 300 DPI cozunurluk
- [x] Tasarimlarin canvas disina cikamamasi (constraint iyilestirme)
- [x] Canvas uzerinde boyut gostergeleri (cm)
- [x] Gorsel boyutlandirma kilidi (en-boy orani koruma)
- [x] Daha iyi scroll/pan deneyimi
- [x] Canvas export preview (kucuk onizleme)

---

## Phase 3: Sepet, Odeme & Odeme Sistemi ✅ TAMAMLANDI

**Hedef:** Tam satin alma akisi.

- [x] Sepet sayfasi (`/sepet`): gang sheet onizleme, fiyat ozeti
- [x] Tasarimi sonrasi icin kaydetme fonksiyonu
- [x] Odeme sayfasi (`/odeme`): adres secimi, odeme yontemi secimi
- [x] PayTR entegrasyonu: kredi karti formu, taksit, 3D Secure callback
- [x] Banka havale akisi: banka bilgilerini goster, admin manuel onaylar
- [x] Siparis olusturma servisi: layout dogrulama, final fiyat hesabi, indirim kodu uygulama
- [x] Odeme sayfasinda indirim kodu girisi

---

## Phase 4: Gang Sheet Export ✅ TAMAMLANDI

**Hedef:** Baskiya hazir dosya uretimi.

- [x] `sharp` ile export servisi: tum gorselleri 300 DPI cozunurlukta birlestir
- [x] PNG export (dusuk sıkistirma, kalite oncelikli)
- [x] TIFF export (LZW sıkistirma)
- [x] PDFKit ile PDF export (tam boyut)
- [x] BullMQ arka plan worker'i — export islemleri icin
- [x] Exportlari S3/MinIO'ya yukle, siparis kaydini guncelle
- [x] Admin icin indirme endpointleri

---

## Phase 5: Siparis Yonetimi & Bildirimler ✅ TAMAMLANDI

**Hedef:** Satin alma sonrasi deneyim.

- [x] Musteri siparis gecmisi (`/hesabim/siparislerim`)
- [x] Siparis detay sayfasi — durum timeline'i ile
- [x] Tekrar siparis ozelligi (onceki layout'u canvas'a yukle)
- [x] Email bildirimleri (react-email): siparis onay, durum guncellemeleri
- [x] SMS bildirimleri — onemli durum degisikliklerinde
- [x] Kaydedilmis tasarimlar yonetim sayfasi

---

## Phase 6: Admin Paneli ✅ TAMAMLANDI

**Hedef:** Tam admin yetenekleri.

- [x] Admin layout — sidebar navigasyon
- [x] Dashboard: gelir grafigi, siparis sayisi, bekleyen siparisler, en iyi musteriler (recharts)
- [x] Siparis yonetimi: filtrelenebilir tablo, durum guncelleme, export indirme, gang sheet onizleme
- [x] Musteri yonetimi: arama, siparis gecmisi, musteriye ozel fiyatlandirma
- [x] Fiyatlandirma yonetimi: duzenlenebilir kademe tablosu, indirim kodu CRUD
- [x] Siparisler ve musteriler icin CSV/Excel export

---

## Phase 7: Son Duzeltmeler & Yayinlama 🔄 DEVAM EDIYOR

- [x] Performans: dynamic imports (recharts, Fabric.js), optimizePackageImports, Cache-Control
- [x] Responsive tasarim denetimi (admin tablolar overflow-x-auto)
- [x] Guvenlik: Redis rate limiting (register, OTP, upload, payment), security headers (CSP, HSTS, X-Frame-Options)
- [x] SEO: robots.txt, sitemap.xml, OG tags, Twitter card, JSON-LD, sayfa baslik sablonu
- [ ] Deployment: Vercel veya VPS (Hetzner Istanbul) + Docker

---

## Teknik Notlar

### Canvas Mimarisi
- **Display:** 800px genislik, `DISPLAY_PX_PER_CM = 800/57 ≈ 14.04`
- **Export:** 300 DPI, `PX_PER_CM = 118.11`, canvas genisligi = 6732px
- **Fabric.js v7:** `originX: 'left', originY: 'top'` zorunlu (default: center)
- **Koordinat sistemi:** Zoom yok, display px ↔ cm donusumu

### Otomatik Yerlestirme (NFDH)
1. Tum tasarimlari adet bazinda genislet
2. Yukseklige gore azalan sirada sirala
3. Soldan saga yatay raflara yerlestir (57cm genislik)
4. Sigmayan tasarim yeni rafa gecer
5. Aralarda 3mm bosluk birak

### Fiyat Hesaplama
1. Canvas nesnelerinin kaplama kutusu → toplam yukseklik (cm)
2. Metreye cevir: `totalHeightCm / 100`
3. Musteriye ozel fiyat varsa → sabit oran
4. Yoksa `PricingTier` tablosundan kademe bul
5. Indirim kodu uygula
6. KDV %20 ekle

### Server-Side Export Pipeline
1. Layout JSON al (gorsel keyleri + cm cinsinden placementlar)
2. BullMQ job: S3'ten orjinalleri indir, `sharp` ile boyutlandir, 300 DPI canvas'a birlestir
3. PNG, TIFF, PDF export → S3'e yukle → siparis kaydini guncelle
4. `sharp.cache(false)` + `sharp.concurrency(1)` — buyuk rulolarda bellek guvenligi
