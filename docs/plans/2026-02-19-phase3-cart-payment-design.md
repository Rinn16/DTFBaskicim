# Phase 3: Sepet, Odeme & PayTR Entegrasyonu — Tasarim Dokumani

> Onaylandi: 2026-02-19

---

## Genel Bakis

Canvas'ta tasarimini tamamlayan kullanici, gang sheet'i sepete ekler, odeme yapar ve siparis olusturur. Iki odeme yontemi desteklenir: **PayTR iFrame API** (kredi karti, tek cekim) ve **banka havalesi** (admin manuel onay). Misafir checkout desteklenir.

---

## Kararlar

| Karar | Secim |
|-------|-------|
| Sepet yapisi | Coklu — birden fazla gang sheet sepete eklenebilir |
| Odeme saglayici | PayTR iFrame API |
| Taksit | Hayir, tek cekim (`no_installment=1`) |
| Test modu | Evet, `PAYTR_TEST_MODE=1` olarak baslar |
| Indirim kodu | Sepet sayfasinda girilir (canvas'taki input kaldirilir veya onizleme kalir) |
| Banka havalesi | Klasik akis: PENDING_PAYMENT → admin manuel onay |
| Misafir checkout | Desteklenir — localStorage cart + inline form + opsiyonel userId |

---

## Kullanici Akisi

```
Uye:     Canvas → Sepete Ekle (DB) → /sepet → /odeme (adres sec) → Odeme
Misafir: Canvas → Sepete Ekle (localStorage) → /sepet → /odeme (bilgi gir) → Odeme
```

### Odeme Akislari

**Kredi Karti (PayTR):**
1. Kullanici "Siparisi Onayla" tiklar
2. Server: Order olustur (PENDING_PAYMENT) → PayTR token al
3. Client: PayTR iframe gosterilir, kullanici kart bilgisi girer
4. PayTR → `POST /api/payment/paytr/callback` (hash dogrulama + durum guncelle)
5. iframe → `merchant_ok_url` → `/odeme/basarili`

**Banka Havalesi:**
1. Kullanici "Banka Havalesi" secer, "Siparisi Onayla" tiklar
2. Server: Order olustur (PENDING_PAYMENT, BANK_TRANSFER)
3. Client: `/odeme/banka-havale` — IBAN, hesap adi, siparis numarasi gosterilir
4. Admin panelden manuel onay → PAYMENT_RECEIVED

---

## API Endpoints

| Method | Route | Auth | Aciklama |
|--------|-------|------|----------|
| `POST` | `/api/cart` | Req | Sepete ekle |
| `GET` | `/api/cart` | Req | Sepeti getir (fiyat dahil) |
| `DELETE` | `/api/cart/[id]` | Req | Sepetten sil |
| `GET` | `/api/addresses` | Req | Adresleri listele |
| `POST` | `/api/addresses` | Req | Adres ekle |
| `PUT` | `/api/addresses/[id]` | Req | Adres guncelle |
| `DELETE` | `/api/addresses/[id]` | Req | Adres sil |
| `POST` | `/api/orders` | Req* | Siparis olustur |
| `GET` | `/api/orders` | Req | Siparisleri listele |
| `GET` | `/api/orders/[orderNumber]` | Req | Siparis detay |
| `POST` | `/api/orders/track` | None | Misafir siparis takip (numara + email) |
| `POST` | `/api/payment/paytr/token` | Req* | PayTR iframe token al |
| `POST` | `/api/payment/paytr/callback` | None | PayTR notification (HMAC dogrulama) |

*Req = giris yapmis veya misafir checkout akisi

---

## Veri Akisi: Canvas → CartItem → Order

### Sepete Ekleme

Canvas store'dan serialize:
```
CartItem.layout = {
  items: GangSheetItem[],
  totalHeightCm: number,
  totalWidthCm: 57
}
CartItem.totalMeters = totalHeightCm / 100
CartItem.items = GangSheetItem[]
```

- Uye: `POST /api/cart` → DB CartItem
- Misafir: localStorage key `"dtf-guest-cart"`

### Siparis Olusturma (POST /api/orders)

1. CartItem'lari al (DB veya request body'den)
2. Server-side fiyat hesapla (`calculatePrice`)
3. Discount code varsa → dogrula + `usedCount` atomik artir
4. Prisma transaction: Order + OrderItem'lar olustur
5. CartItem'lari sil
6. `CREDIT_CARD` → PayTR token al, iframe URL don
7. `BANK_TRANSFER` → PENDING_PAYMENT, banka bilgileri don

---

## PayTR Entegrasyonu

### Token Olusturma

```
Endpoint: POST https://www.paytr.com/odeme/api/get-token

hashStr = merchant_id + user_ip + merchant_oid + email
        + payment_amount + user_basket + no_installment
        + max_installment + currency + test_mode

paytr_token = Base64(HMAC-SHA256(hashStr + merchant_salt, merchant_key))
```

**Parametreler:**
- `merchant_oid` → Order.orderNumber
- `payment_amount` → totalAmount * 100 (kurus)
- `no_installment` → 1
- `currency` → "TL"
- `merchant_ok_url` → `/odeme/basarili`
- `merchant_fail_url` → `/odeme?hata=odeme-basarisiz`
- `test_mode` → 1

### Callback Dogrulama

```
expectedHash = Base64(HMAC-SHA256(
  merchant_oid + merchant_salt + status + total_amount,
  merchant_key
))
```

- Hash eslesmezse → 400 FAIL
- Idempotency: zaten islenmis siparis → "OK" don
- `status === 'success'` → PAYMENT_RECEIVED
- `status === 'failed'` → CANCELLED
- Response: duz metin "OK"

---

## Schema Degisiklikleri

### Order modeli (guncelleme)

```prisma
model Order {
  userId     String?   // opsiyonel (misafir checkout)
  user       User?     @relation(...)

  // Misafir alanlari (yeni)
  guestEmail String?
  guestName  String?
  guestPhone String?

  // ... geri kalan mevcut alanlar ayni
}
```

---

## Sayfa Yapisi

```
src/app/(shop)/
  sepet/page.tsx
  odeme/page.tsx
  odeme/basarili/page.tsx
  odeme/banka-havale/page.tsx
  siparis-takip/page.tsx
```

### /sepet
- Cart item listesi (onizleme + boyut + fiyat + sil)
- Indirim kodu girisi
- Fiyat ozeti (ara toplam, indirim, KDV, toplam)
- "Odemeye Gec" CTA

### /odeme
- Sol: Teslimat bilgisi (uye: adres sec / misafir: inline form) + Odeme yontemi secimi
- Sag: Siparis ozeti sidebar
- Kredi karti secilince: "Siparisi Onayla" → PayTR iframe acilir

### /odeme/basarili
- Siparis numarasi, ozet, yonlendirme linkleri

### /odeme/banka-havale
- IBAN, hesap adi, siparis numarasi uyarisi

### /siparis-takip
- Siparis numarasi + email formu → durum gosterimi (misafirler icin)

---

## Dosya Yapisi

```
src/
  services/
    order.service.ts        # siparis olusturma, fiyat dogrulama
    cart.service.ts         # sepet CRUD
    paytr.service.ts        # token olusturma, callback dogrulama

  validations/
    address.ts              # adres formu
    checkout.ts             # odeme formu
    order.ts                # siparis olusturma

  stores/
    cart-store.ts           # Zustand — uye API + misafir localStorage

  components/
    cart/
      cart-item-card.tsx
      cart-summary.tsx
      discount-input.tsx
    checkout/
      address-form.tsx
      address-selector.tsx
      payment-method.tsx
      paytr-iframe.tsx
      order-summary.tsx
    order/
      order-tracker.tsx
```

---

## Middleware Guncellemesi (proxy.ts)

Public path'lere eklenecekler:
- `/sepet`, `/odeme`, `/odeme/basarili`, `/odeme/banka-havale`
- `/siparis-takip`
- `/api/payment/paytr/callback`

---

## Guvenlik

- **HMAC dogrulama** — PayTR callback hash kontrolu
- **Idempotency** — duplicate callback korunmasi
- **Server-side fiyat hesabi** — client fiyatina guvenilmez
- **Discount code atomik artis** — Prisma transaction
- **PayTR credentials** — `.env`'de, client'a gonderilmez
- **Test modu** — `PAYTR_TEST_MODE=1` olarak baslar

---

## Env Variables

```
PAYTR_MERCHANT_ID=
PAYTR_MERCHANT_KEY=
PAYTR_MERCHANT_SALT=
PAYTR_TEST_MODE=1

BANK_ACCOUNT_NAME=
BANK_IBAN=
BANK_NAME=
```
