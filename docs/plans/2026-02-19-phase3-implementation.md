# Phase 3: Sepet, Odeme & PayTR — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Canvas'tan sepete ekleme, odeme (PayTR iFrame + banka havalesi), misafir checkout ve siparis takip akisini implement etmek.

**Architecture:** Next.js App Router API routes + Zustand cart store (uye: DB, misafir: localStorage) + PayTR iFrame API entegrasyonu. Server-side fiyat dogrulama, HMAC callback guvenlik.

**Tech Stack:** Next.js 16, Prisma 7, Zustand 5, PayTR iFrame API, Zod 4, shadcn/ui

**Design Doc:** `docs/plans/2026-02-19-phase3-cart-payment-design.md`

---

## Task 1: Schema Degisiklikleri & Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/constants.ts`

**Step 1: Order modelinde userId'yi opsiyonel yap + misafir alanlari ekle**

`prisma/schema.prisma` dosyasinda `Order` modelini guncelle:

```prisma
model Order {
  id             String             @id @default(cuid())
  orderNumber    String             @unique
  userId         String?
  user           User?              @relation(fields: [userId], references: [id])
  addressId      String?
  address        Address?           @relation(fields: [addressId], references: [id])

  // Misafir checkout alanlari
  guestEmail     String?
  guestName      String?
  guestPhone     String?

  // ... geri kalan alanlar degismez
}
```

**Step 2: Env degiskenlerini ekle**

`.env` dosyasina ekle:

```
PAYTR_MERCHANT_ID=
PAYTR_MERCHANT_KEY=
PAYTR_MERCHANT_SALT=
PAYTR_TEST_MODE=1

BANK_ACCOUNT_NAME=DTF Baskicim
BANK_IBAN=TR00 0000 0000 0000 0000 0000 00
BANK_NAME=
```

`src/lib/constants.ts` dosyasina ekle:

```typescript
export const BANK_INFO = {
  ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || "DTF Baskicim",
  IBAN: process.env.BANK_IBAN || "",
  BANK_NAME: process.env.BANK_NAME || "",
} as const;
```

**Step 3: Migration calistir**

Run: `npx prisma migrate dev --name add-guest-checkout-fields`

**Step 4: Commit**

```bash
git add prisma/schema.prisma src/lib/constants.ts .env.example
git commit -m "feat: add guest checkout fields to Order model"
```

---

## Task 2: Zod Validasyon Semalari

**Files:**
- Create: `src/validations/address.ts`
- Create: `src/validations/checkout.ts`
- Create: `src/validations/cart.ts`

**Step 1: Adres validasyonu olustur**

`src/validations/address.ts`:

```typescript
import { z } from "zod";

export const addressSchema = z.object({
  title: z.string().min(1, "Adres basligi zorunlu").max(50),
  fullName: z.string().min(2, "Ad soyad zorunlu").max(100),
  phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Gecerli telefon numarasi girin"),
  city: z.string().min(1, "Sehir zorunlu").max(50),
  district: z.string().min(1, "Ilce zorunlu").max(50),
  address: z.string().min(10, "Adres en az 10 karakter olmali").max(400),
  zipCode: z.string().max(10).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
```

**Step 2: Checkout validasyonu olustur**

`src/validations/checkout.ts`:

```typescript
import { z } from "zod";

export const guestInfoSchema = z.object({
  guestName: z.string().min(2, "Ad soyad zorunlu").max(100),
  guestEmail: z.string().email("Gecerli email adresi girin"),
  guestPhone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Gecerli telefon numarasi girin"),
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["CREDIT_CARD", "BANK_TRANSFER"]),
  addressId: z.string().optional(),
  guestAddress: z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/),
    city: z.string().min(1).max(50),
    district: z.string().min(1).max(50),
    address: z.string().min(10).max(400),
    zipCode: z.string().max(10).optional(),
  }).optional(),
  guestInfo: guestInfoSchema.optional(),
  discountCode: z.string().optional(),
  customerNote: z.string().max(500).optional(),
});

export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
```

**Step 3: Cart validasyonu olustur**

`src/validations/cart.ts`:

```typescript
import { z } from "zod";

const gangSheetItemSchema = z.object({
  imageKey: z.string().min(1),
  imageName: z.string().min(1),
  originalWidthPx: z.number().positive(),
  originalHeightPx: z.number().positive(),
  placements: z.array(z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    widthCm: z.number().positive(),
    heightCm: z.number().positive(),
    rotation: z.number(),
  })).min(1),
});

export const addToCartSchema = z.object({
  layout: z.object({
    items: z.array(gangSheetItemSchema).min(1),
    totalHeightCm: z.number().positive(),
    totalWidthCm: z.number().positive(),
  }),
  totalMeters: z.number().positive(),
  items: z.array(gangSheetItemSchema).min(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
```

**Step 4: Commit**

```bash
git add src/validations/address.ts src/validations/checkout.ts src/validations/cart.ts
git commit -m "feat: add validation schemas for cart, address, checkout"
```

---

## Task 3: Cart Servisi & API

**Files:**
- Create: `src/services/cart.service.ts`
- Create: `src/app/api/cart/route.ts`
- Create: `src/app/api/cart/[id]/route.ts`

**Step 1: Cart servisi olustur**

`src/services/cart.service.ts`:

```typescript
import { db } from "@/lib/db";
import type { AddToCartInput } from "@/validations/cart";

export async function getCartItems(userId: string) {
  return db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addCartItem(userId: string, data: AddToCartInput) {
  return db.cartItem.create({
    data: {
      userId,
      layout: data.layout as any,
      totalMeters: data.totalMeters,
      items: data.items as any,
    },
  });
}

export async function deleteCartItem(userId: string, itemId: string) {
  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) return null;
  return db.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(userId: string) {
  return db.cartItem.deleteMany({ where: { userId } });
}
```

**Step 2: Cart API route olustur (GET + POST)**

`src/app/api/cart/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCartItems, addCartItem } from "@/services/cart.service";
import { addToCartSchema } from "@/validations/cart";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }
    const items = await getCartItems(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json({ error: "Sepet yuklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const item = await addCartItem(session.user.id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Sepete eklenemedi" }, { status: 500 });
  }
}
```

**Step 3: Cart item delete API olustur**

`src/app/api/cart/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteCartItem } from "@/services/cart.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteCartItem(session.user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Sepet ogesi bulunamadi" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
```

**Step 4: Commit**

```bash
git add src/services/cart.service.ts src/app/api/cart/
git commit -m "feat: add cart service and API routes"
```

---

## Task 4: Cart Store (Zustand)

**Files:**
- Create: `src/stores/cart-store.ts`

**Step 1: Zustand cart store olustur**

`src/stores/cart-store.ts`:

Uye kullanicilar icin API cagirilari, misafir icin localStorage.

```typescript
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";

export interface CartItemData {
  id: string;
  layout: GangSheetLayout;
  items: GangSheetItem[];
  totalMeters: number;
  createdAt: string;
}

interface CartState {
  guestItems: CartItemData[];
  memberItems: CartItemData[];
  isLoading: boolean;

  // Misafir islemleri (localStorage)
  addGuestItem: (layout: GangSheetLayout, items: GangSheetItem[], totalMeters: number) => void;
  removeGuestItem: (id: string) => void;
  clearGuestCart: () => void;

  // Uye islemleri (API)
  fetchMemberCart: () => Promise<void>;
  addMemberItem: (layout: GangSheetLayout, items: GangSheetItem[], totalMeters: number) => Promise<void>;
  removeMemberItem: (id: string) => Promise<void>;

  // Ortak
  getCartItems: (isAuthenticated: boolean) => CartItemData[];
  getCartCount: (isAuthenticated: boolean) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      guestItems: [],
      memberItems: [],
      isLoading: false,

      addGuestItem: (layout, items, totalMeters) => {
        const newItem: CartItemData = {
          id: crypto.randomUUID(),
          layout,
          items,
          totalMeters,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ guestItems: [...state.guestItems, newItem] }));
      },

      removeGuestItem: (id) => {
        set((state) => ({ guestItems: state.guestItems.filter((i) => i.id !== id) }));
      },

      clearGuestCart: () => set({ guestItems: [] }),

      fetchMemberCart: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            set({ memberItems: data.items });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addMemberItem: async (layout, items, totalMeters) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout, items, totalMeters }),
          });
          if (res.ok) {
            await get().fetchMemberCart();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      removeMemberItem: async (id) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
          if (res.ok) {
            set((state) => ({ memberItems: state.memberItems.filter((i) => i.id !== id) }));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      getCartItems: (isAuthenticated) => {
        const state = get();
        return isAuthenticated ? state.memberItems : state.guestItems;
      },

      getCartCount: (isAuthenticated) => {
        const state = get();
        return isAuthenticated ? state.memberItems.length : state.guestItems.length;
      },
    }),
    {
      name: "dtf-guest-cart",
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
);
```

**Step 2: Commit**

```bash
git add src/stores/cart-store.ts
git commit -m "feat: add Zustand cart store with guest/member support"
```

---

## Task 5: Address API

**Files:**
- Create: `src/app/api/addresses/route.ts`
- Create: `src/app/api/addresses/[id]/route.ts`

**Step 1: Address CRUD API olustur (GET + POST)**

`src/app/api/addresses/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/validations/address";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }
    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Address fetch error:", error);
    return NextResponse.json({ error: "Adresler yuklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz adres bilgisi", details: parsed.error.flatten() }, { status: 400 });
    }

    // Ilk adresse default yap
    const existingCount = await db.address.count({ where: { userId: session.user.id } });

    const address = await db.address.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
        isDefault: existingCount === 0,
      },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Address create error:", error);
    return NextResponse.json({ error: "Adres eklenemedi" }, { status: 500 });
  }
}
```

**Step 2: Address PUT + DELETE olustur**

`src/app/api/addresses/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/validations/address";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadi" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz adres bilgisi", details: parsed.error.flatten() }, { status: 400 });
    }

    const address = await db.address.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json({ error: "Adres guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadi" }, { status: 404 });
    }

    await db.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address delete error:", error);
    return NextResponse.json({ error: "Adres silinemedi" }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/addresses/
git commit -m "feat: add address CRUD API routes"
```

---

## Task 6: PayTR Servisi

**Files:**
- Create: `src/services/paytr.service.ts`

**Step 1: PayTR token olusturma + callback dogrulama servisi**

`src/services/paytr.service.ts`:

```typescript
import crypto from "crypto";

const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID!;
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY!;
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT!;
const TEST_MODE = process.env.PAYTR_TEST_MODE || "1";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface PaytrTokenParams {
  merchantOid: string;
  email: string;
  paymentAmount: number; // kurus cinsinden (TL * 100)
  userName: string;
  userAddress: string;
  userPhone: string;
  userIp: string;
  userBasket: Array<[string, string, number]>; // [name, price, quantity]
}

export async function createPaytrToken(params: PaytrTokenParams): Promise<{ token: string } | { error: string }> {
  const {
    merchantOid, email, paymentAmount,
    userName, userAddress, userPhone, userIp, userBasket,
  } = params;

  const userBasketStr = Buffer.from(JSON.stringify(userBasket)).toString("base64");
  const noInstallment = "1";
  const maxInstallment = "0";
  const currency = "TL";

  const hashStr =
    MERCHANT_ID + userIp + merchantOid + email +
    paymentAmount.toString() + userBasketStr +
    noInstallment + maxInstallment + currency + TEST_MODE;

  const paytrToken = crypto
    .createHmac("sha256", MERCHANT_KEY)
    .update(hashStr + MERCHANT_SALT)
    .digest("base64");

  const formData = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount.toString(),
    paytr_token: paytrToken,
    user_basket: userBasketStr,
    debug_on: "1",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    currency,
    test_mode: TEST_MODE,
    merchant_ok_url: `${BASE_URL}/odeme/basarili`,
    merchant_fail_url: `${BASE_URL}/odeme?hata=odeme-basarisiz`,
    user_name: userName,
    user_address: userAddress,
    user_phone: userPhone,
    timeout_limit: "30",
    lang: "tr",
  });

  const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.status === "success") {
    return { token: result.token };
  }
  return { error: result.reason || "PayTR token alinamadi" };
}

export function verifyPaytrCallback(params: {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}): boolean {
  const { merchantOid, status, totalAmount, hash } = params;

  const expectedHash = crypto
    .createHmac("sha256", MERCHANT_KEY)
    .update(merchantOid + MERCHANT_SALT + status + totalAmount)
    .digest("base64");

  return hash === expectedHash;
}
```

**Step 2: Commit**

```bash
git add src/services/paytr.service.ts
git commit -m "feat: add PayTR service for token creation and callback verification"
```

---

## Task 7: Order Servisi & API

**Files:**
- Create: `src/services/order.service.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[orderNumber]/route.ts`
- Create: `src/app/api/orders/track/route.ts`

**Step 1: Order number generator + siparis olusturma servisi**

`src/services/order.service.ts`:

```typescript
import { db } from "@/lib/db";
import { calculatePrice } from "@/services/pricing.service";
import type { PricingTierData, CustomerPricingData } from "@/types/pricing";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import type { PaymentMethod } from "@/generated/prisma/client";

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DTF-${y}${m}${d}-${rand}`;
}

interface CreateOrderParams {
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  addressId?: string;
  guestAddress?: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    zipCode?: string;
  };
  paymentMethod: PaymentMethod;
  cartItems: Array<{
    id?: string;
    layout: GangSheetLayout;
    items: GangSheetItem[];
    totalMeters: number;
  }>;
  discountCode?: string;
  customerNote?: string;
}

export async function createOrder(params: CreateOrderParams) {
  const {
    userId, guestEmail, guestName, guestPhone,
    addressId, guestAddress, paymentMethod,
    cartItems, discountCode, customerNote,
  } = params;

  // Toplam metre hesapla
  const totalHeightCm = cartItems.reduce(
    (sum, item) => sum + item.layout.totalHeightCm, 0
  );

  // Fiyatlandirma verilerini al
  const tiers = await db.pricingTier.findMany({
    where: { isActive: true },
    orderBy: { minMeters: "asc" },
  });

  const pricingTiers: PricingTierData[] = tiers.map((t) => ({
    id: t.id,
    minMeters: Number(t.minMeters),
    maxMeters: t.maxMeters ? Number(t.maxMeters) : null,
    pricePerMeter: Number(t.pricePerMeter),
  }));

  let customerPricing: CustomerPricingData | null = null;
  if (userId) {
    const cp = await db.customerPricing.findUnique({ where: { userId } });
    if (cp) customerPricing = { pricePerMeter: Number(cp.pricePerMeter) };
  }

  // Indirim kodu dogrulama
  let discountPercent = 0;
  let discountAmount = 0;
  let discountCodeId: string | undefined;

  if (discountCode) {
    const code = await db.discountCode.findUnique({ where: { code: discountCode.toUpperCase() } });
    if (code && code.isActive &&
        new Date() >= code.validFrom && new Date() <= code.validUntil &&
        (code.maxUses === null || code.usedCount < code.maxUses)) {
      const totalMeters = totalHeightCm / 100;
      if (!code.minOrderMeters || totalMeters >= Number(code.minOrderMeters)) {
        discountPercent = code.discountPercent ? Number(code.discountPercent) : 0;
        discountAmount = code.discountAmount ? Number(code.discountAmount) : 0;
        discountCodeId = code.id;
      }
    }
  }

  // Server-side fiyat hesabi
  const priceBreakdown = calculatePrice(
    totalHeightCm, pricingTiers, customerPricing, discountPercent, discountAmount
  );

  // Tum items'i birlestir
  const allItems = cartItems.flatMap((ci) => ci.items);
  const gangSheetLayout: GangSheetLayout = {
    items: allItems,
    totalHeightCm,
    totalWidthCm: 57,
  };

  // Misafir adresini kaydet veya mevcut adresi kullan
  let finalAddressId = addressId;
  if (guestAddress && !addressId) {
    // Misafir icin gecici adres (userId olmadan kaydetmiyoruz, Order'a direkt bilgileri yazacagiz)
    // Ama Address modeli userId zorunlu, bu yuzden adres bilgisini Order'da saklayacagiz
    // guestAddress bilgisi customerNote'a eklenebilir veya ayri bir JSON olarak saklanabilir
    finalAddressId = undefined;
  }

  // Transaction icerisinde siparis olustur
  const order = await db.$transaction(async (tx) => {
    // Indirim kodu usedCount artir
    if (discountCodeId) {
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Siparis olustur
    const orderNumber = generateOrderNumber();
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        addressId: finalAddressId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        totalMeters: priceBreakdown.totalMeters,
        pricePerMeter: priceBreakdown.pricePerMeter,
        subtotal: priceBreakdown.subtotal,
        discountAmount: priceBreakdown.discountAmount,
        taxAmount: priceBreakdown.taxAmount,
        totalAmount: priceBreakdown.totalAmount,
        discountCodeId: discountCodeId || null,
        status: "PENDING_PAYMENT",
        paymentMethod,
        paymentStatus: "PENDING",
        gangSheetLayout: gangSheetLayout as any,
        gangSheetWidth: 6732,
        gangSheetHeight: Math.round(totalHeightCm * 118.11),
        customerNote: customerNote || null,
      },
    });

    // OrderItem'lar olustur
    for (const item of allItems) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          imageKey: item.imageKey,
          imageName: item.imageName,
          imageWidth: item.originalWidthPx,
          imageHeight: item.originalHeightPx,
          quantity: item.placements.length,
          placements: item.placements as any,
        },
      });
    }

    // Durum gecmisi olustur
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        toStatus: "PENDING_PAYMENT",
        note: "Siparis olusturuldu",
      },
    });

    // Uye ise cart temizle
    if (userId) {
      await tx.cartItem.deleteMany({ where: { userId } });
    }

    return newOrder;
  });

  return { order, priceBreakdown };
}
```

**Step 2: Orders API olustur (GET + POST)**

`src/app/api/orders/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/services/order.service";
import { checkoutSchema } from "@/validations/checkout";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        totalMeters: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    const formatted = orders.map((o) => ({
      ...o,
      totalMeters: Number(o.totalMeters),
      totalAmount: Number(o.totalAmount),
    }));

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Siparisler yuklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const { paymentMethod, addressId, guestAddress, guestInfo, discountCode, customerNote } = parsed.data;

    // Sepet ogeleri — uye ise DB'den, misafir ise body'den
    let cartItems;
    if (session?.user?.id) {
      const dbItems = await db.cartItem.findMany({ where: { userId: session.user.id } });
      if (dbItems.length === 0) {
        return NextResponse.json({ error: "Sepetiniz bos" }, { status: 400 });
      }
      cartItems = dbItems.map((item) => ({
        id: item.id,
        layout: item.layout as any,
        items: item.items as any,
        totalMeters: Number(item.totalMeters),
      }));
    } else {
      // Misafir: cartItems body'de gelmeli
      if (!body.cartItems || body.cartItems.length === 0) {
        return NextResponse.json({ error: "Sepetiniz bos" }, { status: 400 });
      }
      if (!guestInfo) {
        return NextResponse.json({ error: "Misafir bilgileri zorunlu" }, { status: 400 });
      }
      cartItems = body.cartItems;
    }

    const { order, priceBreakdown } = await createOrder({
      userId: session?.user?.id,
      guestEmail: guestInfo?.guestEmail,
      guestName: guestInfo?.guestName,
      guestPhone: guestInfo?.guestPhone,
      addressId,
      guestAddress,
      paymentMethod: paymentMethod as any,
      cartItems,
      discountCode,
      customerNote,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        paymentMethod: order.paymentMethod,
      },
      priceBreakdown,
    }, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Siparis olusturulamadi" }, { status: 500 });
  }
}
```

**Step 3: Order detail API olustur**

`src/app/api/orders/[orderNumber]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        address: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        discountCode: { select: { code: true, discountPercent: true, discountAmount: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Yetki kontrolu: uye kendi siparisini, misafir erisemez (track endpoint kullanmali)
    if (order.userId && (!session?.user?.id || session.user.id !== order.userId)) {
      if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 403 });
      }
    }

    return NextResponse.json({
      order: {
        ...order,
        totalMeters: Number(order.totalMeters),
        pricePerMeter: Number(order.pricePerMeter),
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.totalAmount),
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Siparis detayi yuklenemedi" }, { status: 500 });
  }
}
```

**Step 4: Misafir siparis takip API**

`src/app/api/orders/track/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { orderNumber, email } = await request.json();

    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Siparis numarasi ve email zorunlu" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Email eslesmesi kontrolu (uye veya misafir)
    const orderEmail = order.guestEmail;
    if (orderEmail?.toLowerCase() !== email.toLowerCase()) {
      // Uye siparisi olabilir — user tablosundan kontrol et
      if (order.userId) {
        const user = await db.user.findUnique({ where: { id: order.userId } });
        if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
      }
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        totalMeters: Number(order.totalMeters),
        createdAt: order.createdAt,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    console.error("Order track error:", error);
    return NextResponse.json({ error: "Siparis takip edilemedi" }, { status: 500 });
  }
}
```

**Step 5: Commit**

```bash
git add src/services/order.service.ts src/app/api/orders/
git commit -m "feat: add order service and API routes with guest tracking"
```

---

## Task 8: PayTR API Routes

**Files:**
- Create: `src/app/api/payment/paytr/token/route.ts`
- Create: `src/app/api/payment/paytr/callback/route.ts`

**Step 1: PayTR token endpoint**

`src/app/api/payment/paytr/token/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createPaytrToken } from "@/services/paytr.service";

export async function POST(request: Request) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "Siparis numarasi zorunlu" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { user: true, address: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    if (order.paymentMethod !== "CREDIT_CARD") {
      return NextResponse.json({ error: "Bu siparis kredi karti odemesi degil" }, { status: 400 });
    }

    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Bu siparis zaten islendi" }, { status: 400 });
    }

    const headersList = await headers();
    const userIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "127.0.0.1";

    const email = order.user?.email || order.guestEmail || "";
    const userName = order.user?.name
      ? `${order.user.name} ${order.user.surname || ""}`
      : order.guestName || "";
    const userPhone = order.user?.phone || order.guestPhone || "";
    const userAddress = order.address
      ? `${order.address.address}, ${order.address.district}/${order.address.city}`
      : "Belirtilmedi";

    const paymentAmount = Math.round(Number(order.totalAmount) * 100);

    const userBasket: Array<[string, string, number]> = [
      ["DTF Baski Hizmeti", `${Number(order.totalAmount).toFixed(2)}`, 1],
    ];

    const result = await createPaytrToken({
      merchantOid: order.orderNumber,
      email,
      paymentAmount,
      userName,
      userAddress,
      userPhone,
      userIp,
      userBasket,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      token: result.token,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
    });
  } catch (error) {
    console.error("PayTR token error:", error);
    return NextResponse.json({ error: "Odeme baslatilamadi" }, { status: 500 });
  }
}
```

**Step 2: PayTR callback endpoint**

`src/app/api/payment/paytr/callback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaytrCallback } from "@/services/paytr.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const merchantOid = formData.get("merchant_oid") as string;
    const status = formData.get("status") as string;
    const totalAmount = formData.get("total_amount") as string;
    const hash = formData.get("hash") as string;

    if (!merchantOid || !status || !totalAmount || !hash) {
      return new Response("FAIL", { status: 400 });
    }

    // HMAC dogrulama
    const isValid = verifyPaytrCallback({ merchantOid, status, totalAmount, hash });
    if (!isValid) {
      console.error("PayTR callback: invalid hash for", merchantOid);
      return new Response("FAIL", { status: 400 });
    }

    // Idempotency: zaten islenmis mi?
    const order = await db.order.findUnique({ where: { orderNumber: merchantOid } });
    if (!order) {
      console.error("PayTR callback: order not found", merchantOid);
      return new Response("OK");
    }

    if (order.paymentStatus !== "PENDING") {
      // Zaten islenmis, tekrar isleme
      return new Response("OK");
    }

    if (status === "success") {
      await db.$transaction([
        db.order.update({
          where: { orderNumber: merchantOid },
          data: {
            paymentStatus: "COMPLETED",
            status: "PAYMENT_RECEIVED",
          },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "PAYMENT_RECEIVED",
            note: "PayTR odeme basarili",
          },
        }),
      ]);
    } else {
      await db.$transaction([
        db.order.update({
          where: { orderNumber: merchantOid },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED",
          },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "CANCELLED",
            note: `Odeme basarisiz`,
          },
        }),
      ]);
    }

    return new Response("OK");
  } catch (error) {
    console.error("PayTR callback error:", error);
    return new Response("OK"); // PayTR'ye her zaman OK don ki tekrar denemesin
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/payment/
git commit -m "feat: add PayTR token and callback API routes"
```

---

## Task 9: Middleware Guncellemesi + "Sepete Ekle" Butonu

**Files:**
- Modify: `proxy.ts`
- Modify: `src/components/canvas/price-bar.tsx`

**Step 1: Public path'leri guncelle**

`proxy.ts` dosyasinda `publicPaths` dizisine ekle:

```typescript
const publicPaths = [
  "/", "/giris", "/kayit", "/api/auth",
  "/sepet", "/odeme", "/odeme/basarili", "/odeme/banka-havale",
  "/siparis-takip",
  "/api/payment/paytr/callback",
  "/api/orders/track",
];
```

**Step 2: "Sepete Ekle" butonunu isle**

`src/components/canvas/price-bar.tsx` dosyasinda:

1. Import'lari ekle:
```typescript
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import { toast } from "sonner";
```

2. Component icerisinde store ve router'i bagla:
```typescript
const router = useRouter();
const { addGuestItem, addMemberItem } = useCartStore();
```

3. `handleAddToCart` fonksiyonu ekle:
```typescript
const handleAddToCart = async () => {
  const { uploadedImages, placements, totalHeightCm } = useCanvasStore.getState();

  if (placements.length === 0) return;

  // GangSheetItem'lara donustur
  const imageMap = new Map(uploadedImages.map((img) => [img.id, img]));
  const itemsMap = new Map<string, GangSheetItem>();

  for (const p of placements) {
    const img = imageMap.get(p.imageId);
    if (!img) continue;

    if (!itemsMap.has(img.imageKey)) {
      itemsMap.set(img.imageKey, {
        imageKey: img.imageKey,
        imageName: img.imageName,
        originalWidthPx: img.widthPx,
        originalHeightPx: img.heightPx,
        placements: [],
      });
    }
    itemsMap.get(img.imageKey)!.placements.push({
      x: p.x,
      y: p.y,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      rotation: p.rotation,
    });
  }

  const items = Array.from(itemsMap.values());
  const layout: GangSheetLayout = {
    items,
    totalHeightCm,
    totalWidthCm: 57,
  };
  const totalMeters = totalHeightCm / 100;

  try {
    if (session?.user?.id) {
      await addMemberItem(layout, items, totalMeters);
    } else {
      addGuestItem(layout, items, totalMeters);
    }
    toast.success("Tasarim sepete eklendi!");
    router.push("/sepet");
  } catch {
    toast.error("Sepete eklerken hata olustu");
  }
};
```

4. Button'a `onClick` ekle:
```tsx
<Button
  size="lg"
  className="h-10 px-6"
  disabled={placements.length === 0}
  onClick={handleAddToCart}
>
  <ShoppingCart className="h-4 w-4 mr-2" />
  Sepete Ekle
</Button>
```

**Step 3: Commit**

```bash
git add proxy.ts src/components/canvas/price-bar.tsx
git commit -m "feat: wire up 'Sepete Ekle' button and update middleware public paths"
```

---

## Task 10: Sepet Sayfasi & Componentleri

**Files:**
- Create: `src/components/cart/cart-item-card.tsx`
- Create: `src/components/cart/cart-summary.tsx`
- Create: `src/components/cart/discount-input.tsx`
- Create: `src/app/(shop)/sepet/page.tsx`

**Step 1: Cart item card componenti**

`src/components/cart/cart-item-card.tsx`:

Gang sheet onizlemesi (items listesi), boyut bilgisi (57cm x Ycm), metre, fiyat, sil butonu gosteren kart. Her CartItemData icin render edilir.

- Props: `item: CartItemData`, `onRemove: (id: string) => void`, `pricePerMeter: number`
- Gorsel: Card componenti, icerisinde items listesi (her image icin kucuk ikon + isim + adet), boyut, fiyat

**Step 2: Discount input componenti**

`src/components/cart/discount-input.tsx`:

Indirim kodu girisi + "Uygula" butonu. `/api/pricing/discount` endpoint'ini cagirarak kodu dogrular.

- Props: `onApply: (code: string, percent: number, amount: number) => void`, `onClear: () => void`
- State: `code`, `isLoading`, `appliedCode`, `error`

**Step 3: Cart summary componenti**

`src/components/cart/cart-summary.tsx`:

Fiyat ozeti tablosu: ara toplam, indirim, KDV, toplam. "Odemeye Gec" butonu.

- Props: `items: CartItemData[]`, `discountPercent: number`, `discountAmount: number`, `discountCode: string | null`
- Fiyat hesabi icin `calculatePrice` servisini kullanir (client-side onizleme)

**Step 4: Sepet sayfasi**

`src/app/(shop)/sepet/page.tsx`:

```typescript
"use client";
```

- `useCartStore` ile cart items'i al (session durumuna gore member/guest)
- `useSession` ile auth kontrolu
- useEffect ile member cart'i fetch et
- Bos sepet durumu: "Sepetiniz bos" + "Tasarim Olustur" linki
- Dolu: CartItemCard listesi + CartSummary + DiscountInput
- "Odemeye Gec" → `router.push("/odeme")`

**Step 5: Commit**

```bash
git add src/components/cart/ src/app/\(shop\)/sepet/
git commit -m "feat: add cart page with item cards, discount input, and price summary"
```

---

## Task 11: Checkout Sayfasi & Componentleri

**Files:**
- Create: `src/components/checkout/address-form.tsx`
- Create: `src/components/checkout/address-selector.tsx`
- Create: `src/components/checkout/payment-method.tsx`
- Create: `src/components/checkout/order-summary.tsx`
- Create: `src/components/checkout/paytr-iframe.tsx`
- Create: `src/app/(shop)/odeme/page.tsx`

**Step 1: Address form componenti (misafir + yeni adres)**

`src/components/checkout/address-form.tsx`:

React Hook Form + Zod (`addressSchema` + `guestInfoSchema`). Misafir modunda ek alanlar: ad, email, telefon.

- Props: `isGuest: boolean`, `onSubmit: (data) => void`
- Alanlar: title (misafirde gizli), fullName, phone, city, district, address, zipCode
- Misafir ek: guestEmail

**Step 2: Address selector componenti (uyeler icin)**

`src/components/checkout/address-selector.tsx`:

Kayitli adresleri listeler, secim yaptirir. "+ Yeni adres" butonu ile address-form'u acar.

- Props: `onSelect: (addressId: string) => void`, `onAddNew: () => void`
- `/api/addresses` GET ile adresleri ceker
- Radio group ile secim

**Step 3: Payment method componenti**

`src/components/checkout/payment-method.tsx`:

Kredi Karti / Banka Havalesi radio secimi.

- Props: `value: string`, `onChange: (method: string) => void`
- Iki secenek: CREDIT_CARD (kart ikonu), BANK_TRANSFER (banka ikonu)

**Step 4: Order summary componenti**

`src/components/checkout/order-summary.tsx`:

Sag sidebar: sepet ogeleri ozeti + fiyat dokumu.

- Props: `items: CartItemData[]`, `priceBreakdown: PriceBreakdown`

**Step 5: PayTR iframe componenti**

`src/components/checkout/paytr-iframe.tsx`:

PayTR iframe'ini gosteren wrapper. Token alindiktan sonra render edilir.

```typescript
"use client";

interface PaytrIframeProps {
  token: string;
}

export function PaytrIframe({ token }: PaytrIframeProps) {
  return (
    <div className="w-full">
      <script src="https://www.paytr.com/js/iframeResizer.min.js" />
      <iframe
        src={`https://www.paytr.com/odeme/guvenli/${token}`}
        id="paytriframe"
        frameBorder="0"
        scrolling="no"
        style={{ width: "100%" }}
      />
    </div>
  );
}
```

Not: `iframeResizer` scripti icin `next/script` kullanilmali.

**Step 6: Checkout sayfasi**

`src/app/(shop)/odeme/page.tsx`:

```typescript
"use client";
```

Iki sutunlu layout:
- Sol: Teslimat bilgisi (uye: AddressSelector, misafir: AddressForm) + PaymentMethod + "Siparisi Onayla" butonu
- Sag: OrderSummary

Akis:
1. Sepetten items'i al (cart store)
2. Bos sepet → `/sepet`'e yonlendir
3. Form doldur → "Siparisi Onayla"
4. `POST /api/orders` → siparis olustur
5. `CREDIT_CARD` ise: `POST /api/payment/paytr/token` → PayTR iframe goster
6. `BANK_TRANSFER` ise: `/odeme/banka-havale?oid=ORDER_NUMBER` yonlendir

**Step 7: Commit**

```bash
git add src/components/checkout/ src/app/\(shop\)/odeme/page.tsx
git commit -m "feat: add checkout page with address, payment, and PayTR iframe"
```

---

## Task 12: Basari & Banka Havale Sayfalari

**Files:**
- Create: `src/app/(shop)/odeme/basarili/page.tsx`
- Create: `src/app/(shop)/odeme/banka-havale/page.tsx`

**Step 1: Odeme basarili sayfasi**

`src/app/(shop)/odeme/basarili/page.tsx`:

- URL params: `?oid=ORDER_NUMBER`
- Siparis detayini `GET /api/orders/[orderNumber]` ile cek
- Goster: siparis numarasi, toplam tutar, durum
- Uye: "Siparislerime Git" butonu (`/hesabim/siparislerim`)
- Misafir: "Siparis Takip" linki (`/siparis-takip`)
- Confetti veya basari ikonu ile kutlama

**Step 2: Banka havale sayfasi**

`src/app/(shop)/odeme/banka-havale/page.tsx`:

- URL params: `?oid=ORDER_NUMBER`
- Siparis numarasini ve banka bilgilerini goster:
  - Banka adi: `BANK_INFO.BANK_NAME`
  - Hesap adi: `BANK_INFO.ACCOUNT_NAME`
  - IBAN: `BANK_INFO.IBAN`
  - Aciklama: `Siparis No: DTF-XXXXXX-XXXX`
- Uyari: "Lutfen aciklama kismina siparis numaranizi yazin"
- "Kopyala" butonlari (IBAN, siparis no)

**Step 3: Commit**

```bash
git add src/app/\(shop\)/odeme/basarili/ src/app/\(shop\)/odeme/banka-havale/
git commit -m "feat: add payment success and bank transfer info pages"
```

---

## Task 13: Siparis Takip Sayfasi

**Files:**
- Create: `src/components/order/order-tracker.tsx`
- Create: `src/app/(shop)/siparis-takip/page.tsx`

**Step 1: Order tracker componenti**

`src/components/order/order-tracker.tsx`:

Form: siparis numarasi + email → `POST /api/orders/track`.
Sonuc: siparis durumu timeline'i (statusHistory), tutar, tarih.

**Step 2: Siparis takip sayfasi**

`src/app/(shop)/siparis-takip/page.tsx`:

```typescript
"use client";
```

- OrderTracker componentini render et
- Basit layout: baslik + form + sonuc alani

**Step 3: Commit**

```bash
git add src/components/order/ src/app/\(shop\)/siparis-takip/
git commit -m "feat: add guest order tracking page"
```

---

## Task 14: Header Sepet Badge + Son Duzeltmeler

**Files:**
- Modify: `src/components/layout/header.tsx`

**Step 1: Header'a sepet sayaci ekle**

`src/components/layout/header.tsx` dosyasinda:

- `useCartStore` import et
- `useSession` ile auth kontrolu
- Sepet ikonunun yaninda badge ile sayi goster (`getCartCount`)
- `/sepet` linkine tiklandiginda sepet sayfasina git

**Step 2: Son kontroller**

- Tum sayfalarin `(shop)` layout altinda dogru calistigini dogrula
- Middleware'in yeni public path'leri dogru tanidigini dogrula
- Guest cart localStorage'a dogru yazildigini dogrula

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add cart badge to header"
```

---

## Gorev Ozeti

| Task | Konu | Dosya Sayisi |
|------|------|-------------|
| 1 | Schema degisiklikleri + migration | 2 |
| 2 | Zod validasyon semalari | 3 |
| 3 | Cart servisi & API | 3 |
| 4 | Cart store (Zustand) | 1 |
| 5 | Address API | 2 |
| 6 | PayTR servisi | 1 |
| 7 | Order servisi & API | 4 |
| 8 | PayTR API routes | 2 |
| 9 | Middleware + "Sepete Ekle" butonu | 2 |
| 10 | Sepet sayfasi & componentleri | 4 |
| 11 | Checkout sayfasi & componentleri | 6 |
| 12 | Basari & banka havale sayfalari | 2 |
| 13 | Siparis takip sayfasi | 2 |
| 14 | Header sepet badge | 1 |

**Toplam: 14 task, ~35 dosya**

Onerilen siralama: Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14
