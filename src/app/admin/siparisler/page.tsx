"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Play,
  FileText,
  ArrowRight,
} from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { STATUS_COLORS, statusLabel } from "@/lib/order-utils";
import { toast } from "sonner";
import { Suspense } from "react";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  totalMeters: number;
  paymentMethod: string;
  createdAt: string;
  hasExport: boolean;
  customerName: string;
  customerEmail: string;
  itemCount: number;
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkAction, setIsBulkAction] = useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      if (currentStatus) params.set("status", currentStatus);
      if (currentSearch) params.set("search", currentSearch);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setSelectedIds(new Set());
    }
  }, [currentPage, currentStatus, currentSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (updates.status !== undefined || updates.search !== undefined) {
      params.set("page", "1");
    }
    router.push(`/admin/siparisler?${params}`);
  };

  const handleSearch = () => {
    updateParams({ search: searchInput });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const handleBulkAction = async (action: "set_processing" | "export" | "create_invoice") => {
    if (selectedIds.size === 0) return;
    setIsBulkAction(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, orderIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.failCount > 0) {
          toast.warning(`${data.successCount} başarılı, ${data.failCount} başarısız`);
        } else {
          toast.success(`${data.successCount} sipariş işlendi`);
        }
        fetchOrders();
      } else {
        toast.error("Toplu işlem başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsBulkAction(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} sipariş</span>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/admin/export?type=orders" download>
              <Download className="h-4 w-4 mr-1.5" />
              CSV
            </a>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Input
              placeholder="Sipariş no, müşteri, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9"
            />
            <Button size="sm" variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={currentStatus || "ALL"}
            onValueChange={(v) => updateParams({ status: v === "ALL" ? "" : v })}
          >
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Durumlar</SelectItem>
              {Object.entries(ORDER_STATUSES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">
              {selectedIds.size} sipariş seçildi
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("set_processing")}
                disabled={isBulkAction}
              >
                {isBulkAction ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ArrowRight className="h-3.5 w-3.5 mr-1" />}
                Hazırlanıyor&apos;a Al
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("export")}
                disabled={isBulkAction}
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                Export Oluştur
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("create_invoice")}
                disabled={isBulkAction}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Fatura Oluştur
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={orders.length > 0 && selectedIds.size === orders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">Metre</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-center">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(o.id)}
                        onCheckedChange={() => toggleSelect(o.id)}
                      />
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs font-medium"
                      onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                    >
                      {o.orderNumber}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/siparisler/${o.id}`)}>
                      <p className="text-sm">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/siparisler/${o.id}`)}>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${STATUS_COLORS[o.status] || ""}`}
                      >
                        {statusLabel(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums font-medium text-sm"
                      onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                    >
                      {o.totalAmount.toFixed(2)} TL
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums text-sm"
                      onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                    >
                      {o.totalMeters.toFixed(2)} m
                    </TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground"
                      onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                    >
                      {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell
                      className="text-center"
                      onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                    >
                      {o.hasExport && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Sipariş bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Sayfa {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateParams({ page: (currentPage - 1).toString() })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateParams({ page: (currentPage + 1).toString() })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
