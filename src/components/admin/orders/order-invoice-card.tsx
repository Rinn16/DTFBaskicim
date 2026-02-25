"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Download, Loader2 } from "lucide-react";
import { INVOICE_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

interface InvoiceInfo {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  totalAmount: number;
  gibInvoiceId: string | null;
  gibStatus: string | null;
  issuedAt: string | null;
  createdAt: string;
}

interface OrderInvoiceCardProps {
  orderId: string;
  refreshKey?: number;
}

const GIB_STATUS_LABELS: Record<string, string> = {
  SENT_TO_GIB: "GİB'e Gönderildi",
  ACCEPTED: "Kabul Edildi",
  REJECTED: "Reddedildi",
};

export function OrderInvoiceCard({ orderId, refreshKey }: OrderInvoiceCardProps) {
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/invoice`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [orderId, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Fatura Bilgisi</p>
      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Fatura henüz oluşturulmamış</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const statusLabel = INVOICE_STATUSES[inv.status as keyof typeof INVOICE_STATUSES] || inv.status;
            const statusColor =
              inv.status === "ISSUED" || inv.status === "ACCEPTED"
                ? "bg-green-100 text-green-800"
                : inv.status === "REJECTED" || inv.status === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : inv.status === "SENT_TO_GIB"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800";

            return (
              <div key={inv.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{inv.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] h-4 ${statusColor}`}>
                    {statusLabel}
                  </Badge>
                  {inv.type === "IADE" && (
                    <Badge variant="secondary" className="text-[10px] h-4 bg-red-50 text-red-700">
                      İade
                    </Badge>
                  )}
                  {inv.gibStatus && (
                    <Badge variant="secondary" className="text-[10px] h-4 bg-purple-100 text-purple-800">
                      {GIB_STATUS_LABELS[inv.gibStatus] || inv.gibStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {inv.issuedAt
                    ? new Date(inv.issuedAt).toLocaleString("tr-TR")
                    : new Date(inv.createdAt).toLocaleString("tr-TR")}
                </p>
                {inv.gibInvoiceId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/orders/${orderId}/invoice/${inv.id}/pdf`);
                        const data = await res.json();
                        if (res.ok && data.url) {
                          window.open(data.url, "_blank");
                        } else {
                          toast.error(data.error || "PDF indirilemedi");
                        }
                      } catch {
                        toast.error("PDF indirilemedi");
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                    PDF İndir
                  </Button>
                )}
                {invoices.length > 1 && <Separator />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
