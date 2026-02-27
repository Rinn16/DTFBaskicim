# Faz C: Eksik Altyapı — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mevcut cron worker'a e-fatura durum kontrolü eklemek ve yeni sipariş geldiğinde admin'e email bildirimi göndermek.

**Architecture:** Mevcut BullMQ cron worker'a yeni job ekleme (switch-case pattern), email.service.ts'ye yeni fonksiyon ekleme, SiteSettings'e toggle ekleme.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, Redis (BullMQ), Nodemailer

---

## Task 1: E-Fatura Durum Kontrolü Cron Job

Mevcut cron worker'da 3 job var (`cleanup-expired-otps`, `cleanup-abandoned-orders`, `cleanup-old-drafts`). Yeni `check-efatura-status` job'ı eklenecek. `checkGibStatus()` fonksiyonu `src/services/efatura/index.ts`'de zaten var — DB'den `SENT_TO_GIB` faturaları çekip her birini kontrol etmek yeterli.

**Files:**
- Modify: `scripts/export-worker.ts:193-277`

**Step 1: Add cron job registration**

`scripts/export-worker.ts`'de mevcut cron job kayıtlarından sonra (line 208 civarı) yeni job ekle:

```typescript
await cronQueue.add("check-efatura-status", {}, {
  repeat: { pattern: "*/30 * * * *" }, // every 30 minutes
  removeOnComplete: { count: 5 },
  removeOnFail: { count: 10 },
});
```

**Step 2: Add switch case handler**

Aynı dosyada cronWorker switch-case bloğuna (line 276 `cleanup-old-drafts` case'inden sonra, `}` kapanışından önce) yeni case ekle:

```typescript
case "check-efatura-status": {
  // Check if e-fatura is enabled
  const efaturaSettings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { efaturaEnabled: true },
  });
  if (!efaturaSettings?.efaturaEnabled) {
    console.log("[Cron] E-fatura disabled — skipping status check");
    break;
  }

  // Find invoices pending GIB response
  const pendingInvoices = await db.invoice.findMany({
    where: {
      status: "SENT_TO_GIB",
      gibInvoiceId: { not: null },
    },
    select: { id: true, invoiceNumber: true },
    take: 50,
  });

  if (pendingInvoices.length === 0) {
    console.log("[Cron] No pending e-fatura invoices to check");
    break;
  }

  let updated = 0;
  for (const inv of pendingInvoices) {
    try {
      const { checkGibStatus } = await import("@/services/efatura");
      const result = await checkGibStatus(inv.id);
      if (result.status !== "SENT") updated++;
    } catch (err) {
      console.error(`[Cron] E-fatura check failed for ${inv.invoiceNumber}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`[Cron] Checked ${pendingInvoices.length} e-fatura invoices, ${updated} status updated`);
  break;
}
```

**Not:** `checkGibStatus()` fonksiyonu kendi içinde DB update yapıyor — sadece çağırmak yeterli. `import()` dynamic kullanılıyor çünkü worker dosyası ayrı process'te çalışıyor ve `@/services/efatura` modülü `getProvider()` üzerinden SiteSettings'i kontrol ediyor.

**Step 3: Verify build**

Run: `npx next build` (veya en azından TypeScript hatası olmadığını doğrula)

**Step 4: Commit**

```bash
git add scripts/export-worker.ts
git commit -m "feat: add e-fatura status check cron job (every 30 min)"
```

---

## Task 2: Admin Yeni Sipariş Email Bildirimi

Yeni sipariş oluştuğunda admin'e email gönder. Mevcut `sendOrderConfirmation` pattern'i kullanılır (fire-and-forget). SiteSettings'e `emailAdminNewOrder` toggle eklenir.

**Files:**
- Modify: `prisma/schema.prisma:295` (SiteSettings modeli)
- Modify: `src/app/api/admin/settings/route.ts:39` (updateSchema)
- Modify: `src/services/email.service.ts` (yeni fonksiyon)
- Modify: `src/services/order.service.ts:289` (fire-and-forget çağrı)

**Step 1: Add SiteSettings field**

`prisma/schema.prisma`'da SiteSettings modelinde `emailShipped` satırından sonra (line 295) ekle:

```prisma
  emailAdminNewOrder Boolean  @default(true)
```

**Step 2: Run Prisma generate**

Run: `npx prisma generate`

Not: Migration production server'da çalıştırılacak. Lokal olarak sadece `prisma generate` yeterli.

**Step 3: Update admin settings API schema**

`src/app/api/admin/settings/route.ts`'de `updateSchema`'ya (line 39, `emailShipped` satırından sonra) ekle:

```typescript
  emailAdminNewOrder: z.boolean().optional(),
```

**Step 4: Add sendAdminNewOrderNotification to email service**

`src/services/email.service.ts`'nin sonuna (sendContactNotification'dan sonra) yeni fonksiyon ekle:

```typescript
/** Yeni sipariş geldiğinde admin'e bildirim e-postası */
export async function sendAdminNewOrderNotification(data: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  orderDate: string;
}) {
  // Check if this email type is enabled
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings?.emailEnabled || !settings?.emailAdminNewOrder) return;

  // Determine admin email: invoiceCompanyEmail || SMTP_FROM
  const adminEmail = settings.invoiceCompanyEmail || process.env.SMTP_FROM;
  if (!adminEmail) {
    console.warn("[email] No admin email configured for new order notification");
    return;
  }

  const paymentLabel =
    data.paymentMethod === "CREDIT_CARD" ? "Kredi Kartı" :
    data.paymentMethod === "BANK_TRANSFER" ? "Havale/EFT" : data.paymentMethod;

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
      <h2 style="color:#0f172a;margin:0 0 16px;">Yeni Sipariş Alındı</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#64748b;width:140px;">Sipariş No</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${data.orderNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Müşteri</td><td style="padding:8px 0;color:#0f172a;">${data.customerName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Toplam</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${data.totalAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Ürün Sayısı</td><td style="padding:8px 0;color:#0f172a;">${data.itemCount} adet</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Ödeme</td><td style="padding:8px 0;color:#0f172a;">${paymentLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Tarih</td><td style="padding:8px 0;color:#0f172a;">${data.orderDate}</td></tr>
      </table>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `Yeni Sipariş: ${data.orderNumber}`,
    html,
  });
}
```

**Step 5: Call from order service**

`src/services/order.service.ts`'de mevcut `sendOrderConfirmation` fire-and-forget çağrısından sonra (line 289 civarı, `.catch((err) => console.error(...))` satırından sonra) ekle:

```typescript
      // Fire-and-forget admin notification
      sendAdminNewOrderNotification({
        orderNumber: order.orderNumber,
        customerName,
        totalAmount: Number(order.totalAmount),
        itemCount: allItems.length,
        paymentMethod: order.paymentMethod,
        orderDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
      }).catch((err) => console.error("[email] Admin new order notification failed:", err));
```

Import'a ekle (dosyanın başında `sendOrderConfirmation` import'unun yanına):

```typescript
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/services/email.service";
```

**Step 6: Verify build**

Run: `npx next build`

**Step 7: Commit**

```bash
git add prisma/schema.prisma src/app/api/admin/settings/route.ts src/services/email.service.ts src/services/order.service.ts
git commit -m "feat: send email notification to admin on new orders"
```

---

## Deployment Notes

Her iki task tamamlandıktan sonra:
1. `git push origin main`
2. Server'da:
   - `docker compose -f docker-compose.prod.yml build`
   - `docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate dev --name add_email_admin_new_order`
   - `docker compose -f docker-compose.prod.yml up -d`
