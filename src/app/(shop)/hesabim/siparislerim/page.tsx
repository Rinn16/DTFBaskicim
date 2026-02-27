"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Loader2,
  Package,
  Palette,
  Search,
  Ruler,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  STATUS_ACCENT_COLORS,
  STATUS_SHADOW_COLORS,
  statusLabel,
} from "@/lib/order-utils";

interface OrderSummary {
  id: string;
  orderNumber: string;
  totalMeters: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ORDERS_PER_PAGE = 10;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ORDERS_PER_PAGE),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch {
      toast.error("Siparişler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage, searchQuery);
  }, [currentPage, fetchOrders]); // searchQuery handled by debounce

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders(1, value);
    }, 400);
  };

  const totalPages = pagination?.totalPages ?? 1;

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isLoading && orders.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 text-muted-foreground/70 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Henüz siparişiniz yok
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          İlk tasarımınızı oluşturup sipariş verin.
        </p>
        <Link
          href="/tasarim"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all shadow-primary/20 dark:shadow-[0_0_20px_rgba(19,127,236,0.3)]"
        >
          <Palette className="h-4 w-4" />
          Tasarım Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Siparişlerim</h1>
        <p className="text-muted-foreground text-sm">
          Tüm baskı siparişlerinizi buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg leading-5 bg-muted text-foreground/80 placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 sm:text-sm transition-all backdrop-blur-sm"
            placeholder="Sipariş No Ara..."
          />
        </div>
      </div>

      {/* Loading indicator for page changes */}
      {isLoading && orders.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Order Cards */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() =>
              router.push(`/hesabim/siparislerim/${order.orderNumber}`)
            }
            className="order-row glass-panel rounded-xl p-5 border border-border flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 group cursor-pointer relative overflow-hidden"
          >
            {/* Left accent bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_ACCENT_COLORS[order.status] || "bg-slate-500/50"} opacity-0 group-hover:opacity-100 transition-opacity`}
            />

            <div className="flex-grow grid grid-cols-2 md:grid-cols-12 gap-4 items-center w-full">
              {/* Order number + date */}
              <div className="col-span-2 md:col-span-4 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-mono text-sm tracking-wider ${
                      order.status === "PROCESSING" || order.status === "PENDING_PAYMENT"
                        ? "text-primary"
                        : "text-foreground/80"
                    }`}
                  >
                    #{order.orderNumber}
                  </span>
                  {(order.status === "PROCESSING" || order.status === "PENDING_PAYMENT") && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground/70 font-mono">
                  {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Meters */}
              <div className="col-span-1 md:col-span-3">
                <div className="flex items-center gap-2 text-foreground/80">
                  <Ruler className="h-4 w-4 text-muted-foreground/70" />
                  <span className="font-bold">{order.totalMeters.toFixed(1)}m</span>
                  <span className="text-xs text-muted-foreground/70">Baskı</span>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 md:col-span-3">
                <span
                  className={`status-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] || ""} ${STATUS_SHADOW_COLORS[order.status] || ""}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[order.status] || "bg-slate-400"} ${
                      order.status === "PENDING_PAYMENT" || order.status === "PROCESSING"
                        ? "animate-pulse"
                        : ""
                    }`}
                  />
                  {statusLabel(order.status)}
                </span>
              </div>

              {/* Amount */}
              <div className="col-span-2 md:col-span-2 text-right">
                <div className="text-foreground font-bold text-lg tracking-tight">
                  {order.totalAmount.toFixed(2)} TL
                </div>
              </div>
            </div>

            {/* Chevron */}
            <div className="hidden md:flex shrink-0">
              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted group-hover:border-border/80 transition-all">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results for search */}
      {!isLoading && orders.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            &quot;{searchQuery}&quot; ile eşleşen sipariş bulunamadı.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 p-1 rounded-lg border border-border bg-muted backdrop-blur-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {(() => {
              const pages: (number | "...")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push("...");
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (currentPage < totalPages - 2) pages.push("...");
                pages.push(totalPages);
              }
              return pages.map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${
                      page === currentPage
                        ? "bg-primary text-primary-foreground shadow-primary/20 dark:shadow-[0_0_10px_rgba(19,127,236,0.4)]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                )
              );
            })()}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
