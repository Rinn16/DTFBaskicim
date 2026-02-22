"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { STATUS_COLORS, statusLabel } from "@/lib/order-utils";
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
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

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
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/siparisler/${o.id}`)}
                >
                  <TableCell className="font-mono text-xs font-medium">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${STATUS_COLORS[o.status] || ""}`}
                    >
                      {statusLabel(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-sm">
                    {o.totalAmount.toFixed(2)} TL
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {o.totalMeters.toFixed(2)} m
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="text-center">
                    {o.hasExport && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
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
                onClick={() =>
                  updateParams({ page: (currentPage - 1).toString() })
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  updateParams({ page: (currentPage + 1).toString() })
                }
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
