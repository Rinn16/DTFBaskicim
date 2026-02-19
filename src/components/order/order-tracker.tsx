"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, CheckCircle2, Circle, Clock } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";

interface StatusHistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
}

interface TrackResult {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  totalMeters: number;
  createdAt: string;
  statusHistory: StatusHistoryItem[];
}

export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  const handleTrack = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      setError("Siparis numarasi ve email adresi zorunlu");
      return;
    }

    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.order);
      } else {
        const data = await res.json();
        setError(data.error || "Siparis bulunamadi");
      }
    } catch {
      setError("Bir hata olustu");
    } finally {
      setIsLoading(false);
    }
  };

  const statusLabel = (status: string) =>
    ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || status;

  return (
    <div className="space-y-6">
      {/* Search form */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orderNumber">Siparis Numarasi</Label>
            <Input
              id="orderNumber"
              placeholder="DTF-XXXXXX-XXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Adresi</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@ornek.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
          </div>
          <Button className="w-full" onClick={handleTrack} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Siparis Sorgula
          </Button>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Siparis No</p>
              <p className="font-mono font-semibold">{result.orderNumber}</p>
            </div>
            <Badge variant="secondary">{statusLabel(result.status)}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-muted-foreground text-xs">Toplam Tutar</p>
              <p className="font-semibold tabular-nums">{result.totalAmount.toFixed(2)} TL</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Toplam Metre</p>
              <p className="font-semibold tabular-nums">{result.totalMeters.toFixed(2)} m</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Odeme Yontemi</p>
              <p className="font-medium">{result.paymentMethod === "CREDIT_CARD" ? "Kredi Karti" : "Banka Havalesi"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Siparis Tarihi</p>
              <p className="font-medium">{new Date(result.createdAt).toLocaleDateString("tr-TR")}</p>
            </div>
          </div>

          {result.statusHistory.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="font-semibold text-sm mb-3">Siparis Gecmisi</h3>
              <div className="space-y-3">
                {result.statusHistory.map((entry, idx) => {
                  const isLast = idx === result.statusHistory.length - 1;
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {isLast ? (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        {idx < result.statusHistory.length - 1 && (
                          <div className="w-px h-full bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium">{statusLabel(entry.toStatus)}</p>
                        {entry.note && (
                          <p className="text-xs text-muted-foreground">{entry.note}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(entry.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
