# Faz 1: Kritik Hukuki & Veri Güvenliği — Uygulama Planı

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hukuki uyumluluk ve veri güvenliği açıklarını kapatmak — sözleşme kaydı, KVKK hesap silme, email doğrulama, yedekleme, URL tutarlılığı ve PayTR callback güvenliği.

**Architecture:** Mevcut Prisma modelleri genişletilecek, yeni API endpoint'leri eklenecek, checkout akışına termsAcceptedAt alanı eklenecek. Tüm URL referansları tek bir helper'a taşınacak. PayTR callback idempotency ve hata ayrımı eklenecek.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, Nodemailer, Docker, bash scripts

---

## Task 1: Sözleşme Kabul Kaydı

**Files:**
- Modify: `prisma/schema.prisma:288-358` (Order modeli)
- Modify: `src/validations/checkout.ts:69-85` (checkoutSchema)
- Modify: `src/app/api/orders/route.ts:57` (termsAcceptedAt okuma)
- Modify: `src/services/order.service.ts:18-50` (CreateOrderParams + order create)
- Modify: `src/app/(shop)/odeme/page.tsx:221-226` (body'ye timestamp ekleme)

**Step 1: Prisma schema'ya `termsAcceptedAt` ekle**

`prisma/schema.prisma` — Order modeline, `customerNote` satırından sonra ekle:

```prisma
  termsAcceptedAt DateTime?
```

**Step 2: Migration oluştur**

```bash
npx prisma migrate dev --name add_terms_accepted_at
```

**Step 3: Checkout schema'ya `termsAcceptedAt` ekle**

`src/validations/checkout.ts:69-85` — `checkoutSchema`'ya yeni alan ekle:

```typescript
export const checkoutSchema = z.object({
  paymentMethod: z.enum(["CREDIT_CARD", "BANK_TRANSFER"]),
  addressId: z.string().optional(),
  guestAddress: z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().transform((v) => v.replace(/\s/g, "")).pipe(z.string().regex(/^(\+90|0)?[0-9]{10}$/)),
    city: z.string().min(1).max(50),
    district: z.string().min(1).max(50),
    address: z.string().min(10).max(400),
    zipCode: z.string().max(10).optional(),
  }).optional(),
  guestInfo: guestInfoSchema.optional(),
  discountCode: z.string().optional(),
  customerNote: z.string().max(500).optional(),
  billingSameAddress: z.boolean().default(true),
  billingInfo: billingInfoSchema,
  termsAcceptedAt: z.string().datetime(),
});
```

**Step 4: Order service'e `termsAcceptedAt` parametresi ekle**

`src/services/order.service.ts` — `CreateOrderParams` interface'ine ekle:

```typescript
interface CreateOrderParams {
  // ... mevcut alanlar ...
  termsAcceptedAt: string;
}
```

Aynı dosyada `db.order.create` çağrısında `data` objesine ekle:

```typescript
termsAcceptedAt: new Date(params.termsAcceptedAt),
```

**Step 5: API route'ta `termsAcceptedAt` oku ve `createOrder`'a aktar**

`src/app/api/orders/route.ts:57` — destructure'a ekle:

```typescript
const { paymentMethod, addressId, guestAddress, guestInfo, discountCode, customerNote, billingSameAddress, billingInfo, termsAcceptedAt } = parsed.data;
```

`createOrder` çağrısına aktar:

```typescript
const { order, priceBreakdown } = await createOrder({
  // ... mevcut alanlar ...
  termsAcceptedAt,
});
```

**Step 6: Checkout sayfasında body'ye timestamp ekle**

`src/app/(shop)/odeme/page.tsx:221-226` — body objesine ekle:

```typescript
const body: Record<string, unknown> = {
  paymentMethod,
  customerNote: customerNote || undefined,
  billingSameAddress,
  billingInfo: { billingType, ...billingFields },
  termsAcceptedAt: new Date().toISOString(),
};
```

**Step 7: Prisma generate & TypeScript kontrolü**

```bash
npx prisma generate && npx tsc --noEmit
```

**Step 8: Commit**

```
feat: record terms acceptance timestamp on orders
```

---

## Task 2: KVKK Hesap Silme (Anonimleştirme)

**Files:**
- Create: `src/app/api/user/account/route.ts`
- Modify: `src/app/(shop)/hesabim/ayarlar/page.tsx` (silme UI)

**Step 1: Hesap silme API endpoint'i oluştur**

`src/app/api/user/account/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = session.user.id;

    // Aktif sipariş kontrolü
    const activeOrders = await db.order.count({
      where: {
        userId,
        status: { in: ["PROCESSING", "SHIPPED", "PENDING_PAYMENT"] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "Aktif siparişleriniz olduğu için hesabınız şu anda silinemez. Siparişleriniz tamamlandıktan sonra tekrar deneyin." },
        { status: 400 }
      );
    }

    // Kullanıcıyı anonimleştir (VUK gereği fatura verileri 10 yıl saklanır,
    // bu yüzden User kaydını silmek yerine anonimleştiriyoruz)
    const anonymizedEmail = `deleted_${userId}@anonymized.local`;

    await db.$transaction([
      // Kullanıcı profilini anonimleştir
      db.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          phone: null,
          name: "Silinmiş",
          surname: "Kullanıcı",
          passwordHash: null,
          companyName: null,
          taxNumber: null,
          image: null,
          billingFirstName: null,
          billingLastName: null,
          billingFullName: null,
          billingCompanyName: null,
          billingTaxOffice: null,
          billingTaxNumber: null,
          billingAddress: null,
          billingCity: null,
          billingDistrict: null,
          billingZipCode: null,
        },
      }),
      // Adreslerini sil
      db.address.deleteMany({ where: { userId } }),
      // Sepeti temizle
      db.cartItem.deleteMany({ where: { userId } }),
      // Taslakları sil
      db.designDraft.deleteMany({ where: { userId } }),
      // OAuth hesap bağlantılarını sil
      db.account.deleteMany({ where: { userId } }),
      // Oturumları sil
      db.session.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ message: "Hesabınız başarıyla silindi" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Hesap silinirken bir hata oluştu" }, { status: 500 });
  }
}
```

**Step 2: Hesap ayarları sayfasına "Hesabımı Sil" bölümü ekle**

`src/app/(shop)/hesabim/ayarlar/page.tsx` — Sayfanın sonuna, adres bölümünden sonra ekle.

Import'lara ekle:
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { signOut } from "next-auth/react";
```

State'ler:
```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleteLoading, setDeleteLoading] = useState(false);
```

Handler:
```typescript
const handleDeleteAccount = async () => {
  setDeleteLoading(true);
  try {
    const res = await fetch("/api/user/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Hesap silinemedi");
      return;
    }
    toast.success("Hesabınız silindi");
    await signOut({ callbackUrl: "/" });
  } catch {
    toast.error("Bir hata oluştu");
  } finally {
    setDeleteLoading(false);
    setShowDeleteDialog(false);
  }
};
```

JSX (sayfanın sonundaki `</div>` kapanışından önce):
```tsx
{/* Hesap Silme */}
<div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
  <h2 className="text-lg font-bold text-destructive mb-2">Tehlikeli Bölge</h2>
  <p className="text-sm text-muted-foreground mb-4">
    Hesabınızı sildiğinizde tüm kişisel verileriniz anonimleştirilir.
    Adresleriniz, taslaklarınız ve sepetiniz kalıcı olarak silinir.
    Tamamlanmış siparişlerin fatura bilgileri yasal zorunluluk gereği saklanır.
    Bu işlem geri alınamaz.
  </p>
  <Button
    variant="destructive"
    onClick={() => setShowDeleteDialog(true)}
  >
    Hesabımı Sil
  </Button>
</div>

<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Hesabınızı silmek istediğinize emin misiniz?</AlertDialogTitle>
      <AlertDialogDescription>
        Bu işlem geri alınamaz. Tüm kişisel verileriniz anonimleştirilecek,
        adresleriniz ve taslaklarınız kalıcı olarak silinecektir.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={deleteLoading}>İptal</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={handleDeleteAccount}
        disabled={deleteLoading}
      >
        {deleteLoading ? "Siliniyor..." : "Evet, Hesabımı Sil"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```
feat: add KVKK-compliant account deletion with anonymization
```

---

## Task 3: Email Doğrulama Sistemi

**Files:**
- Create: `src/app/api/auth/verify-email/route.ts`
- Create: `src/app/api/auth/resend-verification/route.ts`
- Create: `src/app/(auth)/email-dogrula/[token]/page.tsx`
- Modify: `src/app/api/auth/register/route.ts` (doğrulama emaili gönder)
- Modify: `src/services/email.service.ts` (yeni email fonksiyonu)
- Modify: `src/lib/email-templates.ts` (yeni template)
- Modify: `src/app/(shop)/hesabim/page.tsx` (banner)

**Step 1: Email doğrulama token'ı için mevcut `VerificationToken` modelini kullan**

Prisma schema'da `VerificationToken` zaten var (satır 150-156). Bu modeli kullanacağız. Ek migration gerekmez.

**Step 2: Token oluşturma yardımcı fonksiyonu**

`src/lib/verification.ts` (yeni dosya):

```typescript
import crypto from "crypto";
import { db } from "@/lib/db";

export async function createEmailVerificationToken(email: string) {
  // Mevcut token'ları sil
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}
```

**Step 3: Email doğrulama emaili**

`src/services/email.service.ts` — Yeni export ekle:

```typescript
export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f172a;">Email Adresinizi Doğrulayın</h2>
      <p style="color:#475569;">Hesabınızı tamamlamak için aşağıdaki butona tıklayın:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#137fec;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Email Adresimi Doğrula</a>
      <p style="color:#94a3b8;font-size:13px;">Bu link 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.</p>
    </div>
  `;
  await sendEmail({ to, subject: "Email Adresinizi Doğrulayın - DTF Baskıcım", html });
}
```

Not: `sendEmail` fonksiyonu zaten dosyada private olarak mevcut. `sendVerificationEmail` settings toggle kontrolü yapmaz — her zaman gönderilir (şifre sıfırlama gibi).

**Step 4: Kayıt akışında doğrulama emaili gönder**

`src/app/api/auth/register/route.ts` — Import'lara ekle:

```typescript
import { createEmailVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/services/email.service";
```

User oluşturulduktan sonra (satır 55-62 arası), mevcut welcome email kodunu doğrulama emaili ile değiştir:

```typescript
// Fire-and-forget: doğrulama emaili + hoşgeldin emaili
if (user.email) {
  createEmailVerificationToken(user.email).then((token) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/email-dogrula/${token}`;
    sendVerificationEmail(user.email!, verifyUrl).catch((err) =>
      console.error("[email] Verification email failed:", err)
    );
  }).catch((err) => console.error("[email] Token creation failed:", err));

  sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error("[email] Welcome email failed:", err)
  );
}
```

**Step 5: Email doğrulama API endpoint'i**

`src/app/api/auth/verify-email/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    const record = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş link" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Bu linkin süresi dolmuş. Yeni bir doğrulama emaili isteyin." }, { status: 400 });
    }

    // Email'i doğrula
    await db.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: true },
    });

    // Token'ı sil (tek kullanımlık)
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "Email adresiniz doğrulandı" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
```

**Step 6: Yeniden gönderme endpoint'i**

`src/app/api/auth/resend-verification/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createEmailVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/services/email.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { success } = await rateLimit(`resend-verify:${session.user.id}`, 3, 3600);
    if (!success) {
      return NextResponse.json({ error: "Çok fazla deneme. 1 saat sonra tekrar deneyin." }, { status: 429 });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user?.email) {
      return NextResponse.json({ error: "Email bulunamadı" }, { status: 400 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email zaten doğrulanmış" }, { status: 400 });
    }

    const token = await createEmailVerificationToken(user.email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/email-dogrula/${token}`;
    await sendVerificationEmail(user.email, verifyUrl);

    return NextResponse.json({ message: "Doğrulama emaili gönderildi" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
```

**Step 7: Doğrulama sayfası**

`src/app/(auth)/email-dogrula/[token]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Bir hata oluştu");
      });
  }, [token]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Email doğrulanıyor...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold">{message}</h1>
            <p className="text-muted-foreground">Artık tüm özellikleri kullanabilirsiniz.</p>
            <Button asChild>
              <Link href="/hesabim">Hesabıma Git</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Doğrulama Başarısız</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline">
              <Link href="/hesabim">Hesabıma Dön</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 8: Hesabım sayfasına doğrulama banner'ı ekle**

`src/app/(shop)/hesabim/page.tsx` — Sayfa içeriğinin üstüne, session yüklendikten sonra banner ekle. Bu sayfada session zaten kullanılıyor. Banner'ı `emailVerified` kontrolüyle göster.

Session'dan `emailVerified` bilgisini almak için `auth.ts` JWT callback'ine ekle ve session type'ını genişlet.

**Alternatif (daha basit):** Banner'ı `/api/user/profile` yanıtından `emailVerified` bilgisini okuyarak göster. Bu sayede JWT'yi değiştirmemize gerek kalmaz.

Banner bileşeni (hesabım layout'unda veya page'inde):
```tsx
{profileData && !profileData.emailVerified && (
  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        Email adresiniz doğrulanmamış
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        Hesabınızın güvenliği için email adresinizi doğrulayın.
      </p>
    </div>
    <Button
      size="sm"
      variant="outline"
      className="shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
      onClick={handleResendVerification}
      disabled={resendLoading}
    >
      {resendLoading ? "Gönderiliyor..." : "Doğrulama Emaili Gönder"}
    </Button>
  </div>
)}
```

`handleResendVerification`:
```typescript
const [resendLoading, setResendLoading] = useState(false);

const handleResendVerification = async () => {
  setResendLoading(true);
  try {
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Doğrulama emaili gönderildi! Gelen kutunuzu kontrol edin.");
    } else {
      toast.error(data.error || "Gönderilemedi");
    }
  } catch {
    toast.error("Bir hata oluştu");
  } finally {
    setResendLoading(false);
  }
};
```

**Step 9: `/api/user/profile` response'una `emailVerified` ekle**

Mevcut profile endpoint'ini kontrol et ve response'a `emailVerified` alanını ekle.

**Step 10: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

**Step 11: Commit**

```
feat: add email verification system with token-based flow
```

---

## Task 4: Yedekleme Stratejisi

**Files:**
- Create: `scripts/backup-db.sh`
- Create: `scripts/backup-cleanup.sh`
- Modify: `docker-compose.prod.yml` (backup servisi)

**Step 1: Veritabanı yedekleme scripti**

`scripts/backup-db.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="dtf_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h postgres \
  -U "$POSTGRES_USER" \
  -d "${POSTGRES_DB:-dtf_baskicim}" \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup complete: ${FILENAME} ($(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1))"
```

**Step 2: Eski backup temizleme scripti**

`scripts/backup-cleanup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/postgres"

echo "[$(date)] Cleaning old backups..."

# 7 günden eski günlük backup'ları sil
find "$BACKUP_DIR" -name "dtf_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true

echo "[$(date)] Cleanup complete. Remaining backups:"
ls -lh "$BACKUP_DIR"/ 2>/dev/null || echo "(empty)"
```

**Step 3: Docker Compose'a backup servisi ekle**

`docker-compose.prod.yml` — `volumes:` bölümünden önce ekle:

```yaml
  backup:
    image: postgres:16-alpine
    container_name: dtf-backup
    restart: "no"
    env_file:
      - .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-dtf_baskicim}
    volumes:
      - ./scripts:/scripts:ro
      - backup_data:/backups
    depends_on:
      postgres:
        condition: service_healthy
    entrypoint: /bin/sh
    command: ["-c", "chmod +x /scripts/backup-db.sh /scripts/backup-cleanup.sh && /scripts/backup-db.sh && /scripts/backup-cleanup.sh"]
    deploy:
      resources:
        limits:
          memory: 256M
```

`volumes:` bölümüne `backup_data:` ekle:

```yaml
volumes:
  postgres_data:
  redis_data:
  minio_data:
  backup_data:
```

Not: Bu servis `restart: "no"` ile tanımlı — manuel veya cron ile çalıştırılır:
```bash
docker compose -f docker-compose.prod.yml run --rm backup
```

Sunucuda crontab'a eklenmesi önerilir:
```
0 3 * * * cd /opt/dtfbaskicim && docker compose -f docker-compose.prod.yml run --rm backup >> /var/log/dtf-backup.log 2>&1
```

**Step 4: Script'leri çalıştırılabilir yap**

```bash
chmod +x scripts/backup-db.sh scripts/backup-cleanup.sh
```

**Step 5: Commit**

```
feat: add PostgreSQL backup strategy with Docker service
```

---

## Task 5: Hardcoded Staging URL Temizliği

**Files:**
- Modify: `src/lib/env.ts` (getBaseUrl helper)
- Modify: `src/services/order.service.ts:257`
- Modify: `src/app/api/admin/orders/[orderId]/status/route.ts:112`
- Modify: `src/app/api/admin/email-templates/route.ts:117,119,234,236`
- Modify: `src/app/api/admin/email-templates/preview/route.ts:65`

**Step 1: `getBaseUrl` helper fonksiyonu oluştur**

`src/lib/env.ts` — Dosyanın sonuna ekle:

```typescript
/** Site URL'i — tüm email linkleri ve dışa dönük URL'ler için tek kaynak */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}
```

**Step 2: `order.service.ts`'deki hardcoded URL'i değiştir**

`src/services/order.service.ts:257` — Import ekle ve satırı değiştir:

```typescript
// Dosya başına import ekle:
import { getBaseUrl } from "@/lib/env";

// Satır 257'yi değiştir:
// ESKİ: const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dtfbaskicim.ercanakcan.online";
// YENİ:
const siteUrl = getBaseUrl();
```

**Step 3: `status/route.ts`'deki hardcoded URL'i değiştir**

`src/app/api/admin/orders/[orderId]/status/route.ts:112`:

```typescript
// Import ekle:
import { getBaseUrl } from "@/lib/env";

// Satır 112'yi değiştir:
// ESKİ: const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dtfbaskicim.ercanakcan.online";
// YENİ:
const siteUrl = getBaseUrl();
```

**Step 4: Email template'lerindeki hardcoded URL'leri değiştir**

`src/app/api/admin/email-templates/route.ts` — Bu dosyadaki hardcoded URL'ler default HTML template string'leri içinde. Bunlar DB'ye seed edilen template'ler olduğu için, `{siteUrl}` değişkeni kullanılacak.

Satır 117, 119, 234, 236'daki `https://dtfbaskicim.ercanakcan.online` ifadelerini `{siteUrl}` ile değiştir.

Ardından `replaceVariables` çağrılırken `siteUrl` değerini enjekte et. Bu template'ler DB'den okunduğu için, `email-templates.ts`'deki render fonksiyonlarına `siteUrl` eklenmeli.

**Alternatif (daha basit):** Sadece bu 4 hardcoded string'i `process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"` ile runtime'da değiştirmek yerine, template variable'ı olarak bırakmak daha doğru. Ancak bu template'ler zaten DB'ye kaydedildiği için, template variable'ını `{siteUrl}` olarak tanımlayıp render sırasında doldurmak en temiz çözüm.

`src/lib/email-templates.ts`'deki `replaceVariables` fonksiyonunun çağrıldığı her yerde `siteUrl` değişkenini sampleData'ya ekle.

**Step 5: Preview endpoint'teki hardcoded URL'i değiştir**

`src/app/api/admin/email-templates/preview/route.ts:65`:

```typescript
// Import ekle:
import { getBaseUrl } from "@/lib/env";

// Satır 65'i değiştir:
siparisDetayUrl: `${getBaseUrl()}/hesabim/siparisler`,
```

**Step 6: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

**Step 7: Commit**

```
fix: replace hardcoded staging URLs with getBaseUrl helper
```

---

## Task 6: PayTR Callback Hata Yönetimi

**Files:**
- Modify: `src/app/api/payment/paytr/callback/route.ts`

**Step 1: Outer catch'i düzenle — geçici hatalarda FAIL dön**

`src/app/api/payment/paytr/callback/route.ts` — Mevcut outer catch (satır 144-147):

```typescript
// ESKİ:
} catch (error) {
  console.error("PayTR callback error:", error);
  return new Response("OK"); // PayTR'ye her zaman OK dön ki tekrar denemesin
}

// YENİ:
} catch (error) {
  console.error("PayTR callback error:", error);

  // Geçici hatalarda (DB bağlantı, timeout) FAIL dönüyoruz ki PayTR tekrar denesin.
  // PayTR en fazla 5 kez retry yapar.
  // Sadece doğrulama hataları (hash, tutar) için FAIL + 400 dönüyoruz (zaten yukarıda).
  return new Response("FAIL", { status: 500 });
}
```

**Step 2: İşlenmiş sipariş idempotency kontrolünü güçlendir**

Mevcut idempotency kontrolü (satır 30-33) zaten var ve doğru çalışıyor — `paymentStatus !== "PENDING"` ise `OK` dönüyor. Bu yeterli; PayTR retry yaptığında işlenmiş siparişi tekrar işlemez.

**Step 3: Success transaction'ı içindeki fire-and-forget hataları izole et**

Mevcut kodda export, SMS ve fatura hataları zaten try/catch ile sarılmış (satır 81-111). Bunlar outer catch'e düşmez. Ek değişiklik gerekmez.

**Step 4: Commit**

```
fix: return FAIL on transient PayTR callback errors to allow retry
```

---

## Deployment

Tüm task'lar tamamlandıktan sonra:

```bash
# Commit & push
git push origin main

# Sunucuda
cd /opt/dtfbaskicim
git pull origin main
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Backup cron'u ekle
crontab -e
# 0 3 * * * cd /opt/dtfbaskicim && docker compose -f docker-compose.prod.yml run --rm backup >> /var/log/dtf-backup.log 2>&1
```
