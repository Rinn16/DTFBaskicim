"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CreditCard, RotateCcw, Loader2 } from "lucide-react";
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from "@/lib/constants";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  gatewayRef: string | null;
  refundReason: string | null;
  refundedBy: string | null;
  note: string | null;
  createdAt: string;
}

interface OrderTransactionsProps {
  orderId: string;
  refreshKey?: number;
}

export function OrderTransactions({ orderId, refreshKey }: OrderTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/transactions`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [orderId, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">İşlem Geçmişi</p>
      <div className="space-y-2">
        {transactions.map((tx) => {
          const isRefund = tx.type === "REFUND" || tx.type === "PARTIAL_REFUND";
          const typeLabel = TRANSACTION_TYPES[tx.type as keyof typeof TRANSACTION_TYPES] || tx.type;
          const statusLabel = TRANSACTION_STATUSES[tx.status as keyof typeof TRANSACTION_STATUSES] || tx.status;

          return (
            <div key={tx.id} className="flex items-start gap-3 text-sm p-2 rounded-md bg-muted/30">
              <div className="mt-0.5">
                {isRefund ? (
                  <RotateCcw className="h-4 w-4 text-red-500" />
                ) : (
                  <CreditCard className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{typeLabel}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-4 ${
                      tx.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : tx.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {statusLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`font-medium tabular-nums ${isRefund ? "text-red-600" : "text-green-600"}`}>
                    {isRefund ? "-" : "+"}{Number(tx.amount).toFixed(2)} TL
                  </span>
                </div>
                {tx.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>
                )}
                {tx.gatewayRef && (
                  <p className="text-xs text-muted-foreground">Ref: {tx.gatewayRef}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(tx.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
