"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Loader2,
  Package,
  Plus,
  Ruler,
  ShoppingCart,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { STATUS_COLORS, STATUS_DOT_COLORS, statusLabel } from "@/lib/order-utils";

interface OrderSummary {
  id: string;
  orderNumber: string;
  totalMeters: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ProfileData {
  name: string;
  surname: string;
  emailVerified: boolean | null;
}

interface DashboardData {
  orders: OrderSummary[];
}

const ACTIVE_STATUSES = new Set([
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
]);

export default function AccountDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const emailVerified = profileData?.emailVerified ?? true;
  const profileIncomplete = profileData && (!profileData.name || !profileData.surname);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          fetch("/api/orders?limit=50"),
          fetch("/api/user/profile"),
        ]);
        const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
        setData({ orders: ordersData.orders });
        if (profileRes.ok) {
          const pd = await profileRes.json();
          setProfileData(pd.user);
        }
      } catch {
        toast.error("Hesap bilgileri yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const resData = await res.json();
      if (res.ok) {
        toast.success("Doğrulama emaili gönderildi! Gelen kutunuzu kontrol edin.");
      } else {
        toast.error(resData.error || "Gönderilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const orders = data?.orders ?? [];
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.status)).length;
  const totalMeters = orders.reduce((sum, o) => sum + o.totalMeters, 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      {/* Profil Tamamlama Banner */}
      {profileIncomplete && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Profil bilgilerinizi tamamlayın
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sipariş verebilmek için ad ve soyad bilgilerinizi girmeniz gerekiyor.
              </p>
            </div>
          </div>
          <Link
            href="/hesabim/ayarlar"
            className="shrink-0 inline-flex items-center gap-1 px-4 py-2 text-sm font-medium border border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
          >
            Profili Tamamla
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Email Doğrulama Banner */}
      {!emailVerified && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Email adresiniz doğrulanmamış
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hesabınızın güvenliği için email adresinizi doğrulayın.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            onClick={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading ? "Gönderiliyor..." : "Doğrulama Emaili Gönder"}
          </Button>
        </div>
      )}

      {/* Welcome */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          Hoş geldin,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
            {session?.user?.name || ""}
          </span>
        </h2>
        <p className="text-muted-foreground text-sm">
          Hesap özetinizi ve son siparişlerinizi buradan görüntüleyebilirsiniz.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Orders */}
        <div className="metric-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-primary/20" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-foreground mb-1">{totalOrders}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Toplam Sipariş
              </p>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="metric-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/20" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-foreground mb-1">{activeOrders}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Aktif Siparişler
              </p>
            </div>
          </div>
        </div>

        {/* Total Meters */}
        <div className="metric-card rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-orange-500/20" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform duration-300">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-foreground mb-1">
                {totalMeters.toFixed(1)}
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Toplam Metraj (m)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-10">
        <Link
          href="/tasarim"
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all shadow-primary/20 dark:shadow-[0_0_20px_rgba(19,127,236,0.3)] hover:shadow-primary/30 dark:hover:shadow-[0_0_25px_rgba(19,127,236,0.5)] group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          Yeni Tasarım
        </Link>
        <Link
          href="/hesabim/siparislerim"
          className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground/80 border border-border hover:border-border/80 rounded-lg font-medium transition-all"
        >
          <Package className="h-5 w-5" />
          Siparişlerim
        </Link>
      </div>

      {/* Recent Orders Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-foreground/[0.03]">
          <h3 className="text-lg font-bold text-foreground">Son Siparişler</h3>
          {totalOrders > 5 && (
            <Link
              href="/hesabim/siparislerim"
              className="text-xs font-medium text-primary hover:text-accent-brand transition-colors flex items-center gap-1"
            >
              Tümünü Gör
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Henüz siparişiniz yok. İlk tasarımınızı oluşturun!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-muted-foreground/70 uppercase border-b border-border bg-muted">
                  <th className="px-6 py-4 font-medium">Sipariş No</th>
                  <th className="px-6 py-4 font-medium">Durum</th>
                  <th className="px-6 py-4 font-medium text-right">Tarih</th>
                  <th className="px-6 py-4 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    className={`table-row-hover transition-colors cursor-pointer ${
                      i < recentOrders.length - 1 ? "border-b border-border" : ""
                    }`}
                    onClick={() => {
                      window.location.href = `/hesabim/siparislerim/${order.orderNumber}`;
                    }}
                  >
                    <td className="px-6 py-4 font-mono text-foreground/80">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[order.status] || ""}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${STATUS_DOT_COLORS[order.status] || "bg-slate-400"} ${
                            order.status === "PENDING_PAYMENT" || order.status === "PROCESSING"
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {order.totalAmount.toFixed(2)} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
