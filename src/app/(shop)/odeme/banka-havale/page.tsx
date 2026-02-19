"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Copy, Check, Package, Search, AlertTriangle, Loader2 } from "lucide-react";
import { BANK_INFO } from "@/lib/constants";
import { toast } from "sonner";

export default function BankaHavalePage() {
  return (
    <Suspense fallback={
      <div className="container max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    }>
      <BankaHavaleContent />
    </Suspense>
  );
}

function BankaHavaleContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const orderNumber = searchParams.get("oid") || "";
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Kopyalandi!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Banka Havalesi ile Odeme</h1>
        <p className="text-muted-foreground">
          Asagidaki banka bilgilerine havale/EFT yaparak odemenizi tamamlayabilirsiniz.
        </p>
      </div>

      {/* Order number */}
      <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Siparis Numarasi</p>
            <p className="font-mono font-bold text-lg">{orderNumber}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(orderNumber, "oid")}
          >
            {copiedField === "oid" ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            Kopyala
          </Button>
        </div>
      </Card>

      {/* Bank details */}
      <Card className="p-5 mb-4">
        <h2 className="font-semibold text-base mb-4">Banka Bilgileri</h2>
        <div className="space-y-4">
          {BANK_INFO.BANK_NAME && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Banka</p>
              <p className="font-medium">{BANK_INFO.BANK_NAME}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Hesap Adi</p>
            <p className="font-medium">{BANK_INFO.ACCOUNT_NAME}</p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">IBAN</p>
                <p className="font-mono font-medium text-sm">{BANK_INFO.IBAN || "Belirtilmedi"}</p>
              </div>
              {BANK_INFO.IBAN && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(BANK_INFO.IBAN, "iban")}
                >
                  {copiedField === "iban" ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Kopyala
                </Button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Aciklama</p>
            <div className="flex items-center justify-between">
              <p className="font-mono font-medium text-sm">Siparis No: {orderNumber}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`Siparis No: ${orderNumber}`, "desc")}
              >
                {copiedField === "desc" ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                Kopyala
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Warning */}
      <Card className="p-4 mb-6 border-amber-300/50 bg-amber-50">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Onemli</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Lutfen havale/EFT aciklamasina siparis numaranizi yazmayai unutmayin.
              Odemeniz onaylandiktan sonra sipaarisiniz hazilanmaya baslanacaktir.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {session?.user?.id ? (
          <Button asChild className="w-full">
            <Link href="/hesabim/siparislerim">
              <Package className="h-4 w-4 mr-2" />
              Siparislerime Git
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/siparis-takip">
              <Search className="h-4 w-4 mr-2" />
              Siparis Takip
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild className="w-full">
          <Link href="/tasarim">Yeni Tasarim Olustur</Link>
        </Button>
      </div>
    </div>
  );
}
