"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Search, Loader2 } from "lucide-react";

interface OrderInfo {
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
}

export default function OdemeBasariliPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    }>
      <OdemeBasariliContent />
    </Suspense>
  );
}

function OdemeBasariliContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const orderNumber = searchParams.get("oid");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      setIsLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrder({
            orderNumber: data.order.orderNumber,
            totalAmount: data.order.totalAmount,
            status: data.order.status,
            paymentMethod: data.order.paymentMethod,
          });
        }
      } catch {
        // Order may not be accessible
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sipaarisiniz Alindi!</h1>
        <p className="text-muted-foreground">
          Odemeniz basariyla tamamlandi. Sipaarisiniz en kisa surede hazilanacak.
        </p>
      </div>

      {order && (
        <Card className="p-5 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Siparis No</span>
              <span className="font-mono font-semibold text-sm">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Toplam Tutar</span>
              <span className="font-semibold tabular-nums">{order.totalAmount.toFixed(2)} TL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Durum</span>
              <Badge variant="secondary">Odeme Alindi</Badge>
            </div>
          </div>
        </Card>
      )}

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
