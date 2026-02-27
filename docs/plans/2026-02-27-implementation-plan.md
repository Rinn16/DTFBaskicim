# Şirket Bilgileri & Kod Kalitesi İyileştirmeleri - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Şirket bilgilerini gerçek verilerle güncellemek, sessiz hata yutmayı düzeltmek, kod kalitesini iyileştirmek ve eksik altyapı parçalarını eklemek.

**Architecture:** Mevcut Next.js 15 + Prisma + PostgreSQL mimarisine sadık kalarak, dosya bazlı düzenleme ile ilerlenecek. Test altyapısı kurulu değil — doğrulama `next build` ve manual review ile yapılacak.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, sonner (toast), shadcn/ui

---

## Task 1: Şirket Bilgileri & Adres Güncellemeleri

**Files:**
- Modify: `src/app/(shop)/iletisim/page.tsx:57`
- Modify: `src/app/(shop)/mesafeli-satis-sozlesmesi/page.tsx:28,31`
- Modify: `src/app/(shop)/kullanim-sartlari/page.tsx:134`

**Step 1: İletişim sayfasında adresi güncelle**

`src/app/(shop)/iletisim/page.tsx:57` — Replace:
```tsx
<p className="text-sm text-muted-foreground">İstanbul, Türkiye</p>
```
With:
```tsx
<p className="text-sm text-muted-foreground">
  Güzelyalı Burgaz Mah. Kazım Karabekir Cad. No:13/C
  <br />
  Mudanya / Bursa
</p>
```

**Step 2: Mesafeli satış sözleşmesinde ünvan, adres ve vergi no güncelle**

`src/app/(shop)/mesafeli-satis-sozlesmesi/page.tsx:27-39` — Replace the SATICI info block:
```tsx
<li>
  <span className="font-medium">Unvan:</span> DTF Baskıcım
</li>
<li>
  <span className="font-medium">Adres:</span> İstanbul, Türkiye
</li>
<li>
  <span className="font-medium">E-posta:</span>{" "}
  info@dtfbaskicim.com
</li>
<li>
  <span className="font-medium">Web:</span> www.dtfbaskicim.com
</li>
```
With:
```tsx
<li>
  <span className="font-medium">Ünvan:</span> Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti
</li>
<li>
  <span className="font-medium">Ticari İsim:</span> DTF Baskıcım
</li>
<li>
  <span className="font-medium">Vergi No:</span> 4631210209
</li>
<li>
  <span className="font-medium">Adres:</span> Güzelyalı Burgaz Mah. Kazım Karabekir Cad. No:13/C Mudanya / Bursa
</li>
<li>
  <span className="font-medium">E-posta:</span>{" "}
  info@dtfbaskicim.com
</li>
<li>
  <span className="font-medium">Web:</span> www.dtfbaskicim.com
</li>
```

**Step 3: Kullanım şartlarında mahkeme yetki yerini güncelle**

`src/app/(shop)/kullanim-sartlari/page.tsx:134` — Replace:
```tsx
Uyuşmazlık durumunda İstanbul Mahkemeleri ve İcra Daireleri
yetkilidir.
```
With:
```tsx
Uyuşmazlık durumunda Bursa Mahkemeleri ve İcra Daireleri
yetkilidir.
```

**Step 4: Doğrulama**

Run: `npx next build` — beklenen: build başarılı, hata yok.

**Step 5: Commit**

```bash
git add src/app/(shop)/iletisim/page.tsx src/app/(shop)/mesafeli-satis-sozlesmesi/page.tsx src/app/(shop)/kullanim-sartlari/page.tsx
git commit -m "fix: update company info with real address and legal entity name"
```

---

## Task 2: Sosyal Medya Linkleri

**Files:**
- Modify: `src/components/layout/footer.tsx:32-57`
- Modify: `src/app/(shop)/iletisim/page.tsx:2,80-108`
- Modify: `src/components/home/testimonials-section.tsx:169`

**Step 1: Footer'da Twitter ve LinkedIn kaldır, Instagram güncelle**

`src/components/layout/footer.tsx:32-57` — Replace the entire social links div:
```tsx
<div className="flex gap-8">
  <a
    href="https://instagram.com/dtfbaskicim"
    target="_blank"
    rel="noopener noreferrer"
    className="text-muted-foreground hover:text-primary transition-colors text-sm"
  >
    Instagram
  </a>
  <a
    href="https://twitter.com/dtfbaskicim"
    target="_blank"
    rel="noopener noreferrer"
    className="text-muted-foreground hover:text-primary transition-colors text-sm"
  >
    Twitter
  </a>
  <a
    href="https://linkedin.com/company/dtfbaskicim"
    target="_blank"
    rel="noopener noreferrer"
    className="text-muted-foreground hover:text-primary transition-colors text-sm"
  >
    LinkedIn
  </a>
</div>
```
With:
```tsx
<div className="flex gap-8">
  <a
    href="https://instagram.com/dtf.baskicim"
    target="_blank"
    rel="noopener noreferrer"
    className="text-muted-foreground hover:text-primary transition-colors text-sm"
  >
    Instagram
  </a>
</div>
```

**Step 2: İletişim sayfasında Twitter/LinkedIn kaldır, Instagram güncelle**

`src/app/(shop)/iletisim/page.tsx:2` — Update import:
```tsx
import { Mail, Clock, MapPin, Instagram, Twitter, Linkedin } from "lucide-react";
```
→
```tsx
import { Mail, Clock, MapPin, Instagram } from "lucide-react";
```

`src/app/(shop)/iletisim/page.tsx:82-107` — Replace the social media section content:
```tsx
<div className="flex gap-4">
  <a
    href="https://instagram.com/dtfbaskicim"
    ...
  </a>
  <a
    href="https://twitter.com/dtfbaskicim"
    ...
  </a>
  <a
    href="https://linkedin.com/company/dtfbaskicim"
    ...
  </a>
</div>
```
With:
```tsx
<div className="flex gap-4">
  <a
    href="https://instagram.com/dtf.baskicim"
    target="_blank"
    rel="noopener noreferrer"
    className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/50 transition-colors hover:bg-muted"
  >
    <Instagram className="h-5 w-5 text-muted-foreground" />
  </a>
</div>
```

**Step 3: Testimonials section'da Instagram linkini güncelle**

`src/components/home/testimonials-section.tsx:169` — Replace:
```tsx
href="https://instagram.com/dtfbaskicim"
```
With:
```tsx
href="https://instagram.com/dtf.baskicim"
```

**Step 4: Commit**

```bash
git add src/components/layout/footer.tsx src/app/(shop)/iletisim/page.tsx src/components/home/testimonials-section.tsx
git commit -m "fix: update social media to Instagram only (dtf.baskicim)"
```

---

## Task 3: Banka Hesap Adı & Env & E-Fatura Fallback

**Files:**
- Modify: `src/lib/env.ts:38`
- Modify: `src/lib/constants.ts:43`
- Modify: `.env.example:34`
- Modify: `src/services/efatura/providers/trendyol.ts:265`

**Step 1: env.ts default güncelle**

`src/lib/env.ts:38` — Replace:
```ts
BANK_ACCOUNT_NAME: z.string().default("DTF Baskicim"),
```
With:
```ts
BANK_ACCOUNT_NAME: z.string().default("Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti"),
```

**Step 2: constants.ts fallback güncelle**

`src/lib/constants.ts:43` — Replace:
```ts
ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || "DTF Baskıcım",
```
With:
```ts
ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || "Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti",
```

**Step 3: .env.example güncelle**

`.env.example:34` — Replace:
```
BANK_ACCOUNT_NAME="DTF Baskicim"
```
With:
```
BANK_ACCOUNT_NAME="Rima Reklam Promosyon Danışmanlık Dış Ticaret Ltd Şti"
```

**Step 4: E-fatura city fallback güncelle**

`src/services/efatura/providers/trendyol.ts:265` — Replace:
```ts
city: data.buyerCity && data.buyerCity.length >= 2 ? data.buyerCity : "İstanbul",
```
With:
```ts
city: data.buyerCity && data.buyerCity.length >= 2 ? data.buyerCity : "Bursa",
```

**Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/constants.ts .env.example src/services/efatura/providers/trendyol.ts
git commit -m "fix: update bank account name to Rima Reklam and e-fatura city fallback to Bursa"
```

---

## Task 4: Hardcoded Copyright Yılı Düzeltmeleri

**Files:**
- Modify: `src/app/(standalone)/odeme/basarili/page.tsx:363`
- Modify: `src/app/api/admin/email-templates/route.ts:134,251`

**Step 1: Başarılı ödeme sayfası copyright**

`src/app/(standalone)/odeme/basarili/page.tsx:363` — Replace:
```tsx
<p>&copy; 2025 DTF Baskıcım. Tüm hakları saklıdır.</p>
```
With:
```tsx
<p>&copy; {new Date().getFullYear()} DTF Baskıcım. Tüm hakları saklıdır.</p>
```

**Step 2: Email template route — sipariş onayı copyright**

`src/app/api/admin/email-templates/route.ts:134` — Replace:
```
&copy; 2025 DTF Baskıcım. Tüm hakları saklıdır.
```
With:
```
&copy; ${new Date().getFullYear()} DTF Baskıcım. Tüm hakları saklıdır.
```

**Step 3: Email template route — kargoya verildi copyright**

`src/app/api/admin/email-templates/route.ts:251` — Replace:
```
&copy; 2025 DTF Baskıcım. Tüm hakları saklıdır.
```
With:
```
&copy; ${new Date().getFullYear()} DTF Baskıcım. Tüm hakları saklıdır.
```

**Step 4: Commit**

```bash
git add src/app/(standalone)/odeme/basarili/page.tsx src/app/api/admin/email-templates/route.ts
git commit -m "fix: replace hardcoded 2025 copyright with dynamic year"
```

---

## Task 5: Sessiz Hata Yutma Düzeltmesi — Shop Sayfaları

**Files:**
- Modify: `src/app/(shop)/hesabim/ayarlar/page.tsx:157-158,175-176,196-197,214-215`
- Modify: `src/app/(shop)/hesabim/page.tsx:67-68`
- Modify: `src/app/(shop)/hesabim/siparislerim/page.tsx:67-68` (+ add toast import)
- Modify: `src/app/(shop)/hesabim/siparislerim/[orderNumber]/page.tsx:142-143`
- Modify: `src/app/(shop)/odeme/page.tsx:122-123`

Toast is already imported in all files except `siparislerim/page.tsx`.

**Step 1: hesabim/ayarlar/page.tsx — 4 catch bloğu**

Line 157-158 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Profil bilgileri yüklenemedi");
```

Line 175-176 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Adresler yüklenemedi");
```

Line 196-197 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Aktif oturumlar yüklenemedi");
```

Line 214-215 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Bildirim tercihleri yüklenemedi");
```

**Step 2: hesabim/page.tsx**

Line 67-68 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Hesap bilgileri yüklenemedi");
```

**Step 3: hesabim/siparislerim/page.tsx — add toast import + fix catch**

Add import at top of file (after existing imports):
```ts
import { toast } from "sonner";
```

Line 67-68 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Siparişler yüklenemedi");
```

**Step 4: hesabim/siparislerim/[orderNumber]/page.tsx**

Line 142-143 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Sipariş detayları yüklenemedi");
```

**Step 5: odeme/page.tsx**

Line 122-123 — Replace:
```ts
} catch {
  // ignore
```
With:
```ts
} catch {
  toast.error("Sayfa verileri yüklenemedi");
```

**Step 6: Commit**

```bash
git add src/app/(shop)/hesabim/ayarlar/page.tsx src/app/(shop)/hesabim/page.tsx src/app/(shop)/hesabim/siparislerim/page.tsx "src/app/(shop)/hesabim/siparislerim/[orderNumber]/page.tsx" src/app/(shop)/odeme/page.tsx
git commit -m "fix: replace silent error catches with toast notifications in shop pages"
```

---

## Task 6: Sessiz Hata Yutma Düzeltmesi — Admin Sayfaları

**Files:**
- Modify: `src/app/admin/layout.tsx:106` (console.error, not toast — layout'ta toast uygun değil)
- Modify: `src/app/admin/page.tsx:90-91` (+ add toast import)
- Modify: `src/app/admin/email/page.tsx:109-110,141-142`
- Modify: `src/app/admin/sms/page.tsx:124-125,138-139,152-153`
- Modify: `src/app/admin/ayarlar/page.tsx:123-124`
- Modify: `src/app/admin/siparisler/page.tsx:88-89`
- Modify: `src/app/admin/siparisler/[orderId]/page.tsx:199-200`
- Modify: `src/app/admin/fiyatlandirma/page.tsx:127-128,251-252,390-391`
- Modify: `src/app/admin/musteriler/page.tsx:66-67` (+ add toast import)
- Modify: `src/app/admin/musteriler/[id]/page.tsx:78-79`

**Step 1: admin/layout.tsx — console.error kullan (toast layout'ta uygun değil)**

Line 106 — Replace:
```ts
.catch(() => {});
```
With:
```ts
.catch(() => { console.error("Admin ayarları yüklenemedi"); });
```

**Step 2: admin/page.tsx — add toast import + fix catch**

Add import at top:
```ts
import { toast } from "sonner";
```

Line 90-91 — Replace:
```ts
} catch {
  // silent
```
With:
```ts
} catch {
  toast.error("Dashboard verileri yüklenemedi");
```

**Step 3: admin/email/page.tsx — 2 catch bloğu**

Line 109-110:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Email şablonları yüklenemedi");
```

Line 141-142:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Önizleme yüklenemedi");
```

**Step 4: admin/sms/page.tsx — 3 catch bloğu**

Line 124-125:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("SMS şablonları yüklenemedi");
```

Line 138-139:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Kullanıcı listesi yüklenemedi");
```

Line 152-153:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("SMS kayıtları yüklenemedi");
```

**Step 5: admin/ayarlar/page.tsx**

Line 123-124:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Ayarlar yüklenemedi");
```

**Step 6: admin/siparisler/page.tsx**

Line 88-89:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Siparişler yüklenemedi");
```

**Step 7: admin/siparisler/[orderId]/page.tsx**

Line 199-200:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Sipariş detayları yüklenemedi");
```

**Step 8: admin/fiyatlandirma/page.tsx — 3 catch bloğu**

Line 127-128:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Fiyat kademeleri yüklenemedi");
```

Line 251-252:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("İndirim kodları yüklenemedi");
```

Line 390-391:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Kargo ayarları yüklenemedi");
```

**Step 9: admin/musteriler/page.tsx — add toast import + fix catch**

Add import at top:
```ts
import { toast } from "sonner";
```

Line 66-67:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Müşteri listesi yüklenemedi");
```

**Step 10: admin/musteriler/[id]/page.tsx**

Line 78-79:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Müşteri bilgileri yüklenemedi");
```

**Step 11: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/page.tsx src/app/admin/email/page.tsx src/app/admin/sms/page.tsx src/app/admin/ayarlar/page.tsx src/app/admin/siparisler/page.tsx "src/app/admin/siparisler/[orderId]/page.tsx" src/app/admin/fiyatlandirma/page.tsx src/app/admin/musteriler/page.tsx "src/app/admin/musteriler/[id]/page.tsx"
git commit -m "fix: replace silent error catches with toast notifications in admin pages"
```

---

## Task 7: Sessiz Hata Yutma — Admin Componentleri

**Files:**
- Modify: `src/components/admin/orders/order-transactions.tsx:38-39` (+ add toast import)
- Modify: `src/components/admin/orders/order-invoice-card.tsx:60-61`

**Step 1: order-transactions.tsx**

Add import at top:
```ts
import { toast } from "sonner";
```

Line 38-39:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("İşlem geçmişi yüklenemedi");
```

**Step 2: order-invoice-card.tsx**

Line 60-61:
```ts
} catch {
  // silent
```
→
```ts
} catch {
  toast.error("Fatura bilgileri yüklenemedi");
```

**Step 3: Commit**

```bash
git add src/components/admin/orders/order-transactions.tsx src/components/admin/orders/order-invoice-card.tsx
git commit -m "fix: replace silent error catches with toast notifications in admin components"
```

---

## Task 8: console.log Temizliği & PackResult Dedup

**Files:**
- Modify: `src/services/sms.service.ts:200,208,214,246`
- Modify: `src/services/packing.service.ts:1-9,308`
- Modify: `src/app/api/payment/paytr/callback/route.ts:140`

**Step 1: SMS service — kaldır gereksiz console.log'ları**

`src/services/sms.service.ts:200` — Replace:
```ts
console.log(`[sms] SMS disabled, skipping ${trigger} for order ${order.orderNumber}`);
```
With: (satırı tamamen kaldır)

`src/services/sms.service.ts:208` — Replace:
```ts
console.log(`[sms] No active template for ${trigger}, skipping`);
```
With: (satırı tamamen kaldır)

`src/services/sms.service.ts:214` — Replace:
```ts
console.log(`[sms] No phone for order ${order.orderNumber}, skipping`);
```
With: (satırı tamamen kaldır)

`src/services/sms.service.ts:246` — Replace:
```ts
console.log(`[sms] ${trigger} SMS sent for order ${order.orderNumber}`);
```
With: (satırı tamamen kaldır)

**Step 2: Packing service — console.log kaldır + PackResult import et**

`src/services/packing.service.ts:1-9` — Replace:
```ts
import type { DesignInput, Placement } from "@/types/canvas";
import { ROLL_CONFIG } from "@/lib/constants";

export interface PackResult {
  placements: Placement[];
  totalHeightCm: number;
  totalMeters: number;
  wastePercent: number;
}
```
With:
```ts
import type { DesignInput, Placement, PackResult } from "@/types/canvas";
import { ROLL_CONFIG } from "@/lib/constants";

export type { PackResult };
```

Line 308 — `console.log("[packing] Worker completed successfully")` satırını kaldır.

**Step 3: PayTR callback — console.log → console.error**

`src/app/api/payment/paytr/callback/route.ts:140` — Replace:
```ts
console.log(`PayTR callback: payment failed for order ${merchantOid}, marked as FAILED`);
```
With:
```ts
console.error(`PayTR callback: payment failed for order ${merchantOid}, marked as FAILED`);
```

**Step 4: Commit**

```bash
git add src/services/sms.service.ts src/services/packing.service.ts src/app/api/payment/paytr/callback/route.ts
git commit -m "fix: clean up console.log statements and deduplicate PackResult interface"
```

---

## Task 9: Eksik Error Boundary'ler

**Files:**
- Create: `src/app/(shop)/error.tsx`
- Create: `src/app/admin/error.tsx`

**Step 1: Shop error boundary oluştur**

Create `src/app/(shop)/error.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-destructive">Hata</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Bir şeyler yanlış gitti
      </h1>
      <p className="mt-2 text-muted-foreground">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tekrar Dene
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Admin error boundary oluştur**

Create `src/app/admin/error.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-destructive">Hata</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Bir şeyler yanlış gitti
      </h1>
      <p className="mt-2 text-muted-foreground">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tekrar Dene
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Dashboard&apos;a Dön
        </Link>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add "src/app/(shop)/error.tsx" src/app/admin/error.tsx
git commit -m "feat: add error boundaries for shop and admin route groups"
```

---

## Task 10: PAYTR_TEST_MODE Production Guard

**Files:**
- Modify: `src/lib/env.ts:55-66`

**Step 1: productionRequiredSchema'ya PAYTR_TEST_MODE ekle**

`src/lib/env.ts:55-66` — Replace:
```ts
const productionRequiredSchema = envSchema.extend({
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters in production"),
  SMS_API_KEY: z.string().min(1, "SMS_API_KEY is required in production"),
  SMS_API_SECRET: z.string().min(1, "SMS_API_SECRET is required in production"),
  SMS_SENDER: z.string().min(1, "SMS_SENDER is required in production"),
  PAYTR_MERCHANT_ID: z.string().min(1, "PAYTR_MERCHANT_ID is required in production"),
  PAYTR_MERCHANT_KEY: z.string().min(1, "PAYTR_MERCHANT_KEY is required in production"),
  PAYTR_MERCHANT_SALT: z.string().min(1, "PAYTR_MERCHANT_SALT is required in production"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required in production"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required in production"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required in production"),
});
```
With:
```ts
const productionRequiredSchema = envSchema.extend({
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters in production"),
  SMS_API_KEY: z.string().min(1, "SMS_API_KEY is required in production"),
  SMS_API_SECRET: z.string().min(1, "SMS_API_SECRET is required in production"),
  SMS_SENDER: z.string().min(1, "SMS_SENDER is required in production"),
  PAYTR_MERCHANT_ID: z.string().min(1, "PAYTR_MERCHANT_ID is required in production"),
  PAYTR_MERCHANT_KEY: z.string().min(1, "PAYTR_MERCHANT_KEY is required in production"),
  PAYTR_MERCHANT_SALT: z.string().min(1, "PAYTR_MERCHANT_SALT is required in production"),
  PAYTR_TEST_MODE: z.literal("0", { message: "PAYTR_TEST_MODE must be '0' in production" }),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required in production"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required in production"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required in production"),
});
```

**Step 2: Commit**

```bash
git add src/lib/env.ts
git commit -m "fix: enforce PAYTR_TEST_MODE=0 in production environment"
```

---

## Task 11: DB Index Optimizasyonları

**Files:**
- Modify: `prisma/schema.prisma` — OtpCode, DiscountCode, VerificationToken modelleri

**Step 1: OtpCode modeline expiresAt index'i ekle**

`prisma/schema.prisma` OtpCode modeli — `@@index([phone, code])` satırından sonra ekle:
```prisma
  @@index([expiresAt])
```

**Step 2: DiscountCode modeline isActive index'i ekle**

`prisma/schema.prisma` DiscountCode modeli — `@@index([code])` satırından sonra ekle:
```prisma
  @@index([isActive])
```

**Step 3: VerificationToken modeline identifier index'i ekle**

`prisma/schema.prisma` VerificationToken modeli — `@@unique([identifier, token])` satırından sonra ekle:
```prisma
  @@index([identifier])
```

**Step 4: Migration oluştur**

Run: `npx prisma migrate dev --name add_missing_indexes`
Expected: Migration başarılı.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "perf: add missing database indexes for OtpCode, DiscountCode, VerificationToken"
```

---

## Task 12: İndirim Kodu Kullanıcı Bazlı Takip

**Files:**
- Modify: `prisma/schema.prisma` — DiscountUsage modeli ekle, DiscountCode ve User'a relation ekle
- Modify: `src/app/api/pricing/discount/route.ts` — Kullanıcı bazlı kontrol ekle
- Modify: `src/services/order.service.ts` — Sipariş oluşturulurken DiscountUsage kaydı oluştur

**Step 1: DiscountUsage modelini schema'ya ekle**

`prisma/schema.prisma` — DiscountCode modelinden sonra ekle:

```prisma
model DiscountUsage {
  id             String       @id @default(cuid())
  userId         String
  discountCodeId String
  orderId        String

  user         User         @relation(fields: [userId], references: [id])
  discountCode DiscountCode @relation(fields: [discountCodeId], references: [id])
  order        Order        @relation(fields: [orderId], references: [id])

  usedAt DateTime @default(now())

  @@unique([userId, discountCodeId])
  @@index([discountCodeId])
}
```

DiscountCode modeline relation ekle:
```prisma
  usages DiscountUsage[]
```

User modeline relation ekle:
```prisma
  discountUsages DiscountUsage[]
```

Order modeline relation ekle:
```prisma
  discountUsage DiscountUsage?
```

**Step 2: Migration oluştur**

Run: `npx prisma migrate dev --name add_discount_usage_tracking`

**Step 3: Discount route'da kullanıcı kontrolü ekle**

`src/app/api/pricing/discount/route.ts` — İndirim kodu doğrulandıktan sonra, kullanıcı giriş yapmışsa DiscountUsage tablosunda kayıt var mı kontrol et. Varsa `"Bu indirim kodunu daha önce kullandınız"` hatası dön.

**Step 4: Order service'de DiscountUsage kaydı oluştur**

`src/services/order.service.ts` — Sipariş oluşturma transaction'ında, `discountCodeId` varsa ve `userId` varsa, `DiscountUsage` kaydı oluştur.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/app/api/pricing/discount/route.ts src/services/order.service.ts
git commit -m "feat: add per-user discount code usage tracking"
```

---

## Task 13: Skeleton Loading States

**Files:**
- Create: `src/components/ui/skeleton.tsx` (shadcn/ui component)
- Modify: `src/app/admin/loading.tsx`
- Modify: `src/app/(shop)/loading.tsx`

**Step 1: Skeleton component oluştur**

Run: `npx shadcn@latest add skeleton`

Eğer CLI çalışmazsa, manual olarak `src/components/ui/skeleton.tsx` oluştur:
```tsx
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

**Step 2: Admin loading skeleton**

`src/app/admin/loading.tsx` — Replace entire content:
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      {/* Chart */}
      <Skeleton className="h-72 rounded-lg" />
      {/* Table */}
      <div className="space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Shop loading skeleton**

`src/app/(shop)/loading.tsx` — Replace entire content:
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="space-y-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/ui/skeleton.tsx src/app/admin/loading.tsx "src/app/(shop)/loading.tsx"
git commit -m "feat: add skeleton loading states for admin and shop pages"
```

---

## Task 14: Hero Video Değişikliği

**Files:**
- Modify: `src/app/page.tsx:107`
- Modify: `src/app/(standalone)/odeme/basarili/page.tsx:160`

**Step 1: DTF makinesi videosu bul**

Pexels'tan "DTF printer machine" veya "industrial printing machine" araması yap. Uygun bir video indir.

**Step 2: Videoyu S3/MinIO'ya yükle**

MinIO'ya `videos/hero-dtf-machine.mp4` olarak yükle.

**Step 3: Her iki sayfadaki URL'yi güncelle**

`src/app/page.tsx:107` — Replace:
```tsx
src="https://videos.pexels.com/video-files/3043685/3043685-uhd_2560_1440_24fps.mp4"
```
With:
```tsx
src="{S3_PUBLIC_URL}/videos/hero-dtf-machine.mp4"
```

`src/app/(standalone)/odeme/basarili/page.tsx:160` — Same replacement.

**Not:** Gerçek S3 URL'si deployment ortamına göre belirlenecek. `NEXT_PUBLIC_BASE_URL` veya doğrudan S3 public URL kullanılabilir.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/(standalone)/odeme/basarili/page.tsx
git commit -m "fix: replace external Pexels video with self-hosted DTF machine video"
```

---

## Doğrulama

Tüm task'lar tamamlandıktan sonra:

1. `npx next build` — build başarılı olmalı
2. `npx prisma migrate status` — tüm migration'lar uygulanmış olmalı
3. Manual review: iletişim sayfası, mesafeli satış sözleşmesi, footer, başarılı ödeme sayfası kontrol et
4. Admin panelinde hatalı API çağrısı simüle et → toast göründüğünü doğrula

---

## Deployment

```bash
git push origin main
```

Server'da:
```bash
cd /path/to/dtfbaskicim
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```
