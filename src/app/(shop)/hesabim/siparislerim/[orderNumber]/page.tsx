"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Check,
  Printer,
  Truck,
  CheckCircle2,
  XCircle,
  Undo2,
  ImageIcon,
  MapPin,
  StickyNote,
  Package,
  Copy,
  FileText,
} from "lucide-react";
import {
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  statusLabel,
} from "@/lib/order-utils";
import { ROLL_CONFIG } from "@/lib/constants";
import { toast } from "sonner";
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

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalMeters: number;
  pricePerMeter: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingCost: number;
  trackingCode: string | null;
  hasInvoice: boolean;
  customerNote: string | null;
  createdAt: string;
  address: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    zipCode: string | null;
  } | null;
  items: {
    id: string;
    imageName: string;
    imageWidth: number;
    imageHeight: number;
    quantity: number;
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }[];
  discountCode: {
    code: string;
    discountPercent: number | null;
    discountAmount: number | null;
  } | null;
}

const STATUS_PIPELINE = [
  {
    key: "PENDING_PAYMENT",
    label: "Ödeme Bekleniyor",
    description: "Sipariş oluşturuldu",
    icon: Check,
  },
  {
    key: "PROCESSING",
    label: "Baskıya Alındı",
    description: "İşleme alındı",
    icon: Printer,
  },
  {
    key: "SHIPPED",
    label: "Kargoya Verildi",
    description: "Dağıtıma çıktı",
    icon: Truck,
  },
  {
    key: "COMPLETED",
    label: "Teslim Edildi",
    description: "Sipariş tamamlandı",
    icon: CheckCircle2,
  },
];

const STATUS_ORDER: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  COMPLETED: 3,
};

function pxToCm(px: number) {
  return px / ROLL_CONFIG.PX_PER_CM;
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch {
        toast.error("Sipariş detayları yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    }
    if (orderNumber) fetchOrder();
  }, [orderNumber]);

  const handleReorder = async () => {
    if (!order) return;
    setIsReordering(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/reorder`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Tasarım sepete eklendi!");
        router.push("/sepet");
      } else {
        const data = await res.json();
        toast.error(data.error || "Tekrar sipariş oluşturulamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsReordering(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Sipariş iptal edildi");
        setOrder({
          ...order,
          status: "CANCELLED",
          statusHistory: [
            ...order.statusHistory,
            {
              id: `local-${Date.now()}`,
              fromStatus: order.status,
              toStatus: "CANCELLED",
              note: "Müşteri tarafından iptal edildi",
              createdAt: new Date().toISOString(),
            },
          ],
        });
      } else {
        const data = await res.json();
        toast.error(data.error || "Sipariş iptal edilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Sipariş bulunamadı.</p>
        <Link
          href="/hesabim/siparislerim"
          className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Siparişlere Dön
        </Link>
      </div>
    );
  }

  const currentStatusIndex = STATUS_ORDER[order.status] ?? -1;
  const isCancelled = order.status === "CANCELLED";
  const isRefunded = order.status === "REFUNDED";
  const isTerminal = isCancelled || isRefunded;

  // Find timestamps from statusHistory for each pipeline step
  const stepTimestamps: Record<string, string | null> = {};
  for (const entry of order.statusHistory) {
    stepTimestamps[entry.toStatus] = entry.createdAt;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <Link
            href="/hesabim/siparislerim"
            className="text-muted-foreground/70 hover:text-foreground transition-colors text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Siparişlere Dön
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-2xl font-bold text-foreground tracking-tight font-mono">
              {order.orderNumber}
            </h2>
            <span className="text-sm text-muted-foreground/70">
              {new Date(order.createdAt).toLocaleString("tr-TR")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 ${STATUS_COLORS[order.status] || ""}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[order.status] || "bg-slate-400"} ${
                order.status === "PENDING_PAYMENT" || order.status === "PROCESSING"
                  ? "animate-pulse"
                  : ""
              }`}
            />
            {statusLabel(order.status)}
          </div>
          {/* Invoice Button */}
          {order.hasInvoice && (
            <a
              href={`/api/orders/${order.orderNumber}/invoice/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-border/80 rounded-lg font-medium text-sm transition-all"
            >
              <FileText className="h-4 w-4" />
              Fatura
            </a>
          )}
          {/* Cancel Button — only for PENDING_PAYMENT */}
          {order.status === "PENDING_PAYMENT" && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 rounded-lg font-medium text-sm transition-all"
            >
              <XCircle className="h-4 w-4" />
              İptal Et
            </button>
          )}
          {/* Reorder Button */}
          <button
            onClick={handleReorder}
            disabled={isReordering}
            className="group flex items-center gap-2 px-4 py-2 bg-muted hover:bg-primary text-foreground hover:text-primary-foreground border border-border hover:border-primary rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReordering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            )}
            Tekrar Sipariş Ver
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Timeline */}
        <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
          <h3 className="text-lg font-bold text-foreground mb-6">Sipariş Geçmişi</h3>

          {/* Terminal status banner */}
          {isTerminal && (
            <div
              className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border ${
                isCancelled
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {isCancelled ? (
                <XCircle className="h-5 w-5 shrink-0" />
              ) : (
                <Undo2 className="h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">{statusLabel(order.status)}</p>
                {stepTimestamps[order.status] && (
                  <p className="text-xs opacity-70 font-mono mt-0.5">
                    {new Date(stepTimestamps[order.status]!).toLocaleString("tr-TR")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border md:w-full md:h-0.5 md:left-0 md:top-6 md:bottom-auto" />

            <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative z-10">
              {STATUS_PIPELINE.map((step, idx) => {
                const isCompleted = !isTerminal && currentStatusIndex >= idx;
                const isCurrent = !isTerminal && currentStatusIndex === idx;
                const StepIcon = step.icon;
                const timestamp = stepTimestamps[step.key];

                return (
                  <div
                    key={step.key}
                    className={`flex md:flex-col items-start md:items-center gap-4 md:gap-2 ${
                      !isCompleted ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-primary/20 border border-primary text-primary shadow-primary/20 dark:shadow-[0_0_15px_rgba(19,127,236,0.4)]"
                          : "bg-muted border border-border text-muted-foreground/70"
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="md:text-center pt-1 md:pt-2">
                      <p
                        className={`text-sm ${
                          isCompleted ? "text-foreground font-bold" : "text-foreground font-medium"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      {isCompleted && timestamp && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
                          {new Date(timestamp).toLocaleString("tr-TR")}
                        </p>
                      )}
                      {isCurrent && !timestamp && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
                          {new Date(order.createdAt).toLocaleString("tr-TR")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tracking Code */}
        {order.trackingCode && (order.status === "SHIPPED" || order.status === "COMPLETED") && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Kargo Takip
            </h3>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 font-mono text-sm text-foreground tracking-wider">
                {order.trackingCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.trackingCode!);
                  toast.success("Takip kodu kopyalandı");
                }}
                className="shrink-0 w-10 h-10 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Kopyala"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="glass-panel rounded-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-muted/30 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          <h3 className="text-lg font-bold text-foreground mb-6 relative z-10">
            Fiyat Detayı
          </h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Toplam Metre</span>
              <span className="font-mono text-foreground">
                {order.totalMeters.toFixed(2)} m
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Metre Fiyatı</span>
              <span className="font-mono text-foreground">
                {order.pricePerMeter.toFixed(2)} TL/m
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Ara Toplam</span>
              <span className="font-mono text-foreground">
                {order.subtotal.toFixed(2)} TL
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-emerald-400">
                <span>
                  İndirim
                  {order.discountCode && (
                    <span className="text-xs ml-1 text-emerald-500/70">
                      ({order.discountCode.code})
                    </span>
                  )}
                </span>
                <span className="font-mono">
                  -{order.discountAmount.toFixed(2)} TL
                </span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Kargo Ücreti</span>
                <span className="font-mono text-foreground">
                  {order.shippingCost.toFixed(2)} TL
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>KDV (%20)</span>
              <span className="font-mono text-foreground">
                {order.taxAmount.toFixed(2)} TL
              </span>
            </div>

            {/* Dotted separator */}
            <div className="h-px my-4 receipt-line" />

            <div className="flex justify-between items-end">
              <div>
                <span className="text-lg font-bold text-foreground block">Toplam</span>
                <span className="text-xs text-muted-foreground/70">Ödeme Yöntemi</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground tracking-tight block">
                  {order.totalAmount.toFixed(2)} TL
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {order.paymentMethod === "CREDIT_CARD"
                    ? "Kredi Kartı"
                    : "Banka Havalesi"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">
            Ürünler ({order.items.length})
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => {
              const widthCm = pxToCm(item.imageWidth);
              const heightCm = pxToCm(item.imageHeight);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted border border-border hover:border-border/80 transition-colors group"
                >
                  <div className="w-16 h-16 rounded bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ImageIcon className="h-5 w-5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-foreground font-medium text-sm mb-1 truncate">
                      {item.imageName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <span>
                        {widthCm.toFixed(0)}x{heightCm.toFixed(0)} cm
                      </span>
                      <span className="w-1 h-1 bg-border rounded-full" />
                      <span>DTF Baskı</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-muted-foreground text-sm">x{item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address */}
        {order.address && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Teslimat Adresi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-foreground font-bold text-sm mb-2">
                  {order.address.fullName}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                  {order.address.address}, {order.address.district}/{order.address.city}
                  {order.address.zipCode && ` ${order.address.zipCode}`}
                </p>
                <p className="text-muted-foreground/70 text-sm font-mono">{order.address.phone}</p>
              </div>
              <div className="hidden md:block h-24 rounded-lg bg-muted/50 border border-border relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Note */}
        {order.customerNote && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-muted-foreground" />
              Sipariş Notu
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {order.customerNote}
            </p>
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi iptal etmek istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{order.orderNumber}</strong> numaralı siparişiniz iptal edilecektir.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "İptal ediliyor..." : "Evet, İptal Et"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
