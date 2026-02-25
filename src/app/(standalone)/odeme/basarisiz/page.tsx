"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Package, Search, Loader2, HelpCircle } from "lucide-react";
import { PaytrIframe } from "@/components/checkout/paytr-iframe";
import { toast } from "sonner";

export default function OdemeBasarisizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OdemeBasarisizContent />
    </Suspense>
  );
}

function OdemeBasarisizContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const orderNumber = searchParams.get("oid") || "";
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryToken, setRetryToken] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!orderNumber) return;
    setIsRetrying(true);
    try {
      const res = await fetch("/api/payment/paytr/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setRetryToken(data.token);
      } else {
        toast.error(data.error || "Tekrar deneme başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsRetrying(false);
    }
  };

  // Show PayTR iframe if retry token obtained
  if (retryToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <h1 className="text-xl font-bold text-center mb-4">Ödeme</h1>
          <Card className="p-1">
            <PaytrIframe token={retryToken} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Error icon */}
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Ödeme Başarısız</h1>
        <p className="text-muted-foreground mb-6">
          Ödeme işleminiz tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
        </p>

        {orderNumber && (
          <Card className="p-4 mb-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Sipariş Numarası</p>
                <p className="font-mono font-bold">{orderNumber}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {orderNumber && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
              size="lg"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Tekrar Dene
            </Button>
          )}

          {session?.user?.id ? (
            <Button variant="outline" asChild className="w-full" size="lg">
              <Link href="/hesabim/siparislerim">
                <Package className="h-4 w-4 mr-2" />
                Siparişlerime Git
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild className="w-full" size="lg">
              <Link href="/siparis-takip">
                <Search className="h-4 w-4 mr-2" />
                Sipariş Takip
              </Link>
            </Button>
          )}

          <Button variant="ghost" asChild className="w-full" size="lg">
            <Link href="/iletisim">
              <HelpCircle className="h-4 w-4 mr-2" />
              Yardım Al
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Sorun devam ederse lütfen bizimle iletişime geçin.
        </p>
      </div>
    </div>
  );
}
