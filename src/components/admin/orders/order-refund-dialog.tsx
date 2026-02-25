"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalAmount: number;
  priorRefundTotal: number;
  onRefundComplete: () => void;
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  totalAmount,
  priorRefundTotal,
  onRefundComplete,
}: RefundDialogProps) {
  const refundable = totalAmount - priorRefundTotal;
  const [amount, setAmount] = useState(refundable.toFixed(2));
  const [reason, setReason] = useState("");
  const [createReturnInvoice, setCreateReturnInvoice] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    if (numAmount > refundable) {
      toast.error(`İade tutarı kalan bakiyeyi aşıyor (${refundable.toFixed(2)} TL)`);
      return;
    }
    if (!reason.trim()) {
      toast.error("İade nedeni zorunludur");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          reason: reason.trim(),
          createReturnInvoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          data.isFullRefund
            ? "Tam iade işlemi tamamlandı"
            : `Kısmi iade tamamlandı: ${numAmount.toFixed(2)} TL`
        );
        onOpenChange(false);
        onRefundComplete();
      } else {
        const data = await res.json();
        toast.error(data.error || "İade işlemi başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İade İşlemi Başlat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {priorRefundTotal > 0 && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Önceki iadeler: {priorRefundTotal.toFixed(2)} TL
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                Kalan iade edilebilir tutar: {refundable.toFixed(2)} TL
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>İade Tutarı (TL)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={refundable}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Sipariş toplamı: {totalAmount.toFixed(2)} TL — Maks. iade: {refundable.toFixed(2)} TL
            </p>
          </div>

          <div className="space-y-2">
            <Label>İade Nedeni *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="İade nedenini yazın..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="returnInvoice"
              checked={createReturnInvoice}
              onCheckedChange={(v) => setCreateReturnInvoice(v === true)}
            />
            <label htmlFor="returnInvoice" className="text-sm cursor-pointer">
              İade faturası oluştur
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmRefund"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
            />
            <label htmlFor="confirmRefund" className="text-sm cursor-pointer">
              İade işlemini onaylıyorum
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!confirmed || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            İade Yap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
