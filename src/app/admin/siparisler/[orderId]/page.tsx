"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  ArrowLeft,
  Download,
  Play,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Ruler,
  Image as ImageIcon,
  Truck,
  Package,
  RotateCcw,
  ChevronDown,
  CircleDot,
  Receipt,
  FileText,
} from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { STATUS_COLORS, statusLabel } from "@/lib/order-utils";
import { StatusTimeline } from "@/components/order/status-timeline";
import { RefundDialog } from "@/components/admin/orders/order-refund-dialog";
import { OrderTransactions } from "@/components/admin/orders/order-transactions";
import { OrderInvoiceCard } from "@/components/admin/orders/order-invoice-card";
import { PackingSlipButton } from "@/components/admin/orders/order-packing-slip";
import { toast } from "sonner";

interface GangSheetDetail {
  id: string;
  gangSheetWidth: number;
  gangSheetHeight: number;
  totalMeters: number;
  exportPng: string | null;
  exportTiff: string | null;
  exportPdf: string | null;
  gangSheetLayout: {
    items: { imageName: string; placements: unknown[] }[];
    totalHeightCm: number;
    totalWidthCm: number;
  };
  createdAt: string;
}

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
  shippingCost: number;
  totalAmount: number;
  trackingCode: string | null;
  customerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  gangSheetWidth: number;
  gangSheetHeight: number;
  exportPng: string | null;
  exportTiff: string | null;
  exportPdf: string | null;
  gangSheets: GangSheetDetail[];
  address: {
    title: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    zipCode: string | null;
  } | null;
  user: {
    id: string;
    name: string;
    surname: string;
    email: string | null;
    phone: string | null;
  } | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  billingType: string;
  billingSameAddress: boolean;
  billingFullName: string | null;
  billingCompanyName: string | null;
  billingTaxOffice: string | null;
  billingTaxNumber: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingDistrict: string | null;
  billingZipCode: string | null;
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
    eventType?: string | null;
    createdAt: string;
  }[];
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingSheetIds, setExportingSheetIds] = useState<Set<string>>(new Set());
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [trackingCodeInput, setTrackingCodeInput] = useState("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOrder = useCallback(async () => {
    try {
      const detailRes = await fetch(`/api/admin/orders/${orderId}`);
      if (detailRes.ok) {
        const data = await detailRes.json();
        setOrder(data.order);
        setAdminNote(data.order.adminNote || "");
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  const handleStatusUpdate = async (status: string, note?: string, trackingCode?: string) => {
    if (!order || status === order.status) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || undefined,
          adminNote: adminNote || undefined,
          ...(trackingCode && { trackingCode }),
        }),
      });
      if (res.ok) {
        toast.success("Durum güncellendi");
        fetchOrder();
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json();
        toast.error(data.error || "Güncelleme başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!order) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: order.status, adminNote }),
      });
      if (res.ok) {
        toast.success("Not kaydedildi");
      } else {
        toast.error("Not kaydedilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleExport = async (gangSheetId?: string) => {
    if (!order) return;
    if (gangSheetId) {
      setExportingSheetIds((prev) => new Set(prev).add(gangSheetId));
    } else {
      setIsExporting(true);
    }
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gangSheetId ? { gangSheetId } : {}),
      });
      if (res.ok) {
        toast.success("Export kuyruğa eklendi");
        setTimeout(fetchOrder, 5000);
      } else {
        toast.error("Export başlatılamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      if (gangSheetId) {
        setExportingSheetIds((prev) => {
          const next = new Set(prev);
          next.delete(gangSheetId);
          return next;
        });
      } else {
        setIsExporting(false);
      }
    }
  };

  const handleExportAll = async () => {
    if (!order || !order.gangSheets.length) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success("Tüm gang sheet'ler kuyruğa eklendi");
        setTimeout(fetchOrder, 5000);
      } else {
        toast.error("Export başlatılamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (format: string, gangSheetId?: string) => {
    if (!order) return;
    const params = new URLSearchParams({ format });
    if (gangSheetId) params.set("gangSheetId", gangSheetId);
    window.open(`/api/admin/orders/${order.id}/download?${params.toString()}`, "_blank");
  };

  const handleCreateInvoice = async () => {
    if (!order) return;
    setIsCreatingInvoice(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/invoice`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Fatura oluşturuldu");
        setRefreshKey((k) => k + 1);
        fetchOrder();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fatura oluşturulamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Sipariş bulunamadı</p>
      </div>
    );
  }

  const hasGangSheets = order.gangSheets && order.gangSheets.length > 0;
  const hasExport = hasGangSheets
    ? order.gangSheets.every((gs) => !!(gs.exportPng && gs.exportTiff && gs.exportPdf))
    : !!(order.exportPng && order.exportTiff && order.exportPdf);
  const customerName = order.user
    ? `${order.user.name} ${order.user.surname}`
    : order.guestName || "Misafir";
  const customerEmail = order.user?.email || order.guestEmail;
  const customerPhone = order.user?.phone || order.guestPhone;
  const paymentLabel =
    order.paymentMethod === "CREDIT_CARD" ? "Kredi Kartı" : "Banka Havalesi";
  const paymentStatusLabel =
    order.paymentStatus === "COMPLETED"
      ? "Ödendi"
      : order.paymentStatus === "FAILED"
        ? "Başarısız"
        : "Bekliyor";
  const totalPlacements = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <Link
          href="/admin/siparisler"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Siparişler
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono tracking-tight">
              {order.orderNumber}
            </h1>
            <span className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("tr-TR")}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={`text-sm w-fit ${STATUS_COLORS[order.status] || ""}`}
          >
            {statusLabel(order.status)}
          </Badge>
        </div>
      </div>

      {/* ── Menubar ── */}
      <Menubar className="w-fit">
        {/* Status Update */}
        <MenubarMenu>
          <MenubarTrigger className="gap-1.5 cursor-pointer">
            <CircleDot className="h-4 w-4" />
            Durum Güncelle
          </MenubarTrigger>
          <MenubarContent>
            {Object.entries(ORDER_STATUSES).map(([key, label]) => (
              <MenubarItem
                key={key}
                disabled={key === order.status || isUpdating}
                onClick={() => handleStatusUpdate(key)}
                className="cursor-pointer"
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    key === order.status ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
                {label}
                {key === order.status && (
                  <span className="ml-auto text-xs text-muted-foreground">Mevcut</span>
                )}
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>

        {/* Cargo */}
        <MenubarMenu>
          <MenubarTrigger className="gap-1.5 cursor-pointer">
            <Truck className="h-4 w-4" />
            Kargo
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                setTrackingCodeInput(order.trackingCode || "");
                setShippingDialogOpen(true);
              }}
              disabled={order.status === "SHIPPED" || order.status === "COMPLETED" || isUpdating}
              className="cursor-pointer"
            >
              <Truck className="h-4 w-4 mr-1.5" />
              Kargoya verildi olarak işaretle
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem className="cursor-pointer p-0">
              <PackingSlipButton
                orderNumber={order.orderNumber}
                orderDate={order.createdAt}
                customerName={customerName}
                address={order.address}
                items={order.items.map((i) => ({ imageName: i.imageName, quantity: i.quantity }))}
                totalMeters={order.totalMeters}
                trackingCode={order.trackingCode}
              />
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Invoice */}
        <MenubarMenu>
          <MenubarTrigger className="gap-1.5 cursor-pointer">
            <Receipt className="h-4 w-4" />
            Fatura
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={handleCreateInvoice}
              disabled={isCreatingInvoice}
              className="cursor-pointer"
            >
              {isCreatingInvoice ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <FileText className="h-4 w-4 mr-1.5" />
              )}
              Fatura Oluştur
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Refund */}
        <MenubarMenu>
          <MenubarTrigger className="gap-1.5 cursor-pointer">
            <RotateCcw className="h-4 w-4" />
            İade
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => setRefundDialogOpen(true)}
              disabled={
                order.status === "REFUNDED" ||
                order.status === "PENDING_PAYMENT" ||
                isUpdating
              }
              className="cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              İade İşlemi Başlat
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              onClick={() => handleStatusUpdate("CANCELLED", "Sipariş iptal edildi")}
              disabled={
                order.status === "CANCELLED" ||
                order.status === "REFUNDED" ||
                isUpdating
              }
              variant="destructive"
              className="cursor-pointer"
            >
              Siparişi iptal et
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* ── 2 Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gang Sheet Cards */}
          {hasGangSheets ? (
            <div className="space-y-3">
              {!hasExport && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportAll}
                    disabled={isExporting}
                    className="gap-1.5"
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Tümünü Export Et
                  </Button>
                </div>
              )}

              {order.gangSheets.map((gs, idx) => {
                const gsHasExport = !!(gs.exportPng && gs.exportTiff && gs.exportPdf);
                const gsIsExporting = exportingSheetIds.has(gs.id);
                const gsLayout = gs.gangSheetLayout;
                const gsItemCount = gsLayout.items?.length ?? 0;
                const gsPlacementCount = gsLayout.items?.reduce(
                  (sum: number, item: { placements: unknown[] }) => sum + (item.placements?.length ?? 0),
                  0
                ) ?? 0;

                return (
                  <Card key={gs.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-20 h-24 bg-muted rounded-md flex items-center justify-center border border-dashed">
                        <div className="text-center">
                          <Ruler className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground font-medium">
                            57x{(gs.gangSheetHeight / (300 / 2.54)).toFixed(0)}cm
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-sm">Gang Sheet {idx + 1}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {gs.totalMeters.toFixed(2)} metre
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 gap-1.5">
                                <Download className="h-3.5 w-3.5" />
                                İndir
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {gsHasExport ? (
                                <>
                                  <DropdownMenuItem onClick={() => handleDownload("png", gs.id)} className="cursor-pointer">PNG</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload("tiff", gs.id)} className="cursor-pointer">TIFF</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload("pdf", gs.id)} className="cursor-pointer">PDF</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport(gs.id)} disabled={gsIsExporting} className="cursor-pointer">
                                    {gsIsExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
                                    Yeniden export et
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem onClick={() => handleExport(gs.id)} disabled={gsIsExporting} className="cursor-pointer">
                                  {gsIsExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                                  Export oluştur
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {gsLayout.items?.map((item: { imageName: string; placements: unknown[] }, itemIdx: number) => (
                            <Badge key={itemIdx} variant="secondary" className="text-[11px] h-5 gap-1 font-normal">
                              <ImageIcon className="h-3 w-3" />
                              {item.imageName.length > 20 ? item.imageName.slice(0, 20) + "..." : item.imageName}
                              <span className="text-muted-foreground">x{item.placements?.length ?? 0}</span>
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-3">
                          <span className="text-xs text-muted-foreground">
                            {gsItemCount} görsel, {gsPlacementCount} yerleşim
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-20 h-24 bg-muted rounded-md flex items-center justify-center border border-dashed">
                  <div className="text-center">
                    <Ruler className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      57x{(order.gangSheetHeight / (300 / 2.54)).toFixed(0)}cm
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-sm">Gang Sheet</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.totalMeters.toFixed(2)} metre
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          İndir
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {hasExport ? (
                          <>
                            <DropdownMenuItem onClick={() => handleDownload("png")} className="cursor-pointer">PNG</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload("tiff")} className="cursor-pointer">TIFF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload("pdf")} className="cursor-pointer">PDF</DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleExport()} disabled={isExporting} className="cursor-pointer">
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                            Export oluştur
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {order.items.map((item) => (
                      <Badge key={item.id} variant="secondary" className="text-[11px] h-5 gap-1 font-normal">
                        <ImageIcon className="h-3 w-3" />
                        {item.imageName.length > 20 ? item.imageName.slice(0, 20) + "..." : item.imageName}
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3">
                    <span className="text-xs text-muted-foreground">
                      {order.items.length} görsel, {totalPlacements} yerleşim
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Price Breakdown + Payment + Transactions + Timeline */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* Price breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toplam Metre</span>
                  <span className="font-medium tabular-nums">{order.totalMeters.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Birim Fiyat</span>
                  <span className="font-medium tabular-nums">{order.pricePerMeter.toFixed(2)} TL/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span className="font-medium tabular-nums">{order.subtotal.toFixed(2)} TL</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span className="font-medium tabular-nums">-{order.discountAmount.toFixed(2)} TL</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KDV (%20)</span>
                  <span className="font-medium tabular-nums">{order.taxAmount.toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kargo</span>
                  <span className={`font-medium tabular-nums ${order.shippingCost === 0 ? "text-green-600" : ""}`}>
                    {order.shippingCost === 0 ? "Ücretsiz" : `${order.shippingCost.toFixed(2)} TL`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Toplam</span>
                  <span className="text-xl font-bold tabular-nums">{order.totalAmount.toFixed(2)} TL</span>
                </div>
              </div>

              <Separator />

              {/* Payment */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ödeme</span>
                <div className="flex items-center gap-2">
                  <span>{paymentLabel}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      order.paymentStatus === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : order.paymentStatus === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {paymentStatusLabel}
                  </Badge>
                </div>
              </div>

              {/* Transactions */}
              <Separator />
              <OrderTransactions orderId={order.id} refreshKey={refreshKey} />

              {/* Timeline */}
              {order.statusHistory.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-3">Zaman Çizelgesi</p>
                    <StatusTimeline statusHistory={order.statusHistory} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (1/3) — Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-5">
                {/* Customer */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Müşteri</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {order.user ? (
                      <Link
                        href={`/admin/musteriler/${order.user.id}`}
                        className="text-primary hover:underline font-medium truncate"
                      >
                        {customerName}
                      </Link>
                    ) : (
                      <span className="font-medium truncate">{customerName}</span>
                    )}
                  </div>
                  {customerEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{customerEmail}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                {order.address && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Teslimat Adresi</p>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-muted-foreground font-medium">{order.address.title}</p>
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <p>{order.address.fullName}</p>
                            <p>{order.address.address}</p>
                            <p>
                              {order.address.district}/{order.address.city}
                              {order.address.zipCode && ` ${order.address.zipCode}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{order.address.phone}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Billing Info */}
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fatura Bilgileri</p>
                  {order.billingSameAddress ? (
                    <p className="text-sm text-muted-foreground">Teslimat adresi ile aynı</p>
                  ) : (
                    <div className="space-y-1.5 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {order.billingType === "CORPORATE" ? "Kurumsal" : "Bireysel"}
                      </Badge>
                      {order.billingType === "CORPORATE" ? (
                        <>
                          {order.billingCompanyName && <p className="font-medium">{order.billingCompanyName}</p>}
                          {order.billingTaxOffice && order.billingTaxNumber && (
                            <p className="text-muted-foreground">{order.billingTaxOffice} - {order.billingTaxNumber}</p>
                          )}
                        </>
                      ) : (
                        order.billingFullName && <p className="font-medium">{order.billingFullName}</p>
                      )}
                      {order.billingAddress && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <Receipt className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <p>{order.billingAddress}</p>
                            <p>
                              {order.billingDistrict}/{order.billingCity}
                              {order.billingZipCode && ` ${order.billingZipCode}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cargo Info */}
                {order.trackingCode && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Kargo Bilgisi</p>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Takip Kodu:</span>
                        <Badge variant="secondary" className="font-mono text-xs">{order.trackingCode}</Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Notlar</p>
                  {order.customerNote && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Müşteri Notu</span>
                      </div>
                      <p className="text-sm bg-muted/50 rounded-md p-2.5 italic">{order.customerNote}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Admin Notu</label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="İç not (müşteriye gösterilmez)"
                      rows={3}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="mt-2 w-full"
                    >
                      {isSavingNote && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                      Kaydet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Card */}
            <Card>
              <CardContent className="pt-6">
                <OrderInvoiceCard orderId={order.id} refreshKey={refreshKey} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Shipping Dialog */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargoya Verildi Olarak İşaretle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Kargo Takip Kodu</Label>
              <Input
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                placeholder="Takip kodunu girin (opsiyonel)"
              />
              <p className="text-xs text-muted-foreground">
                Takip kodu girilirse müşteriye SMS ile gönderilir.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>İptal</Button>
            <Button
              onClick={async () => {
                setShippingDialogOpen(false);
                await handleStatusUpdate("SHIPPED", "Kargoya verildi", trackingCodeInput.trim() || undefined);
              }}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        orderId={order.id}
        totalAmount={order.totalAmount}
        priorRefundTotal={0}
        onRefundComplete={() => {
          fetchOrder();
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
