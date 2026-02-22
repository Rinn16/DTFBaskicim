"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  CalendarDays,
  Package,
  Clock,
} from "lucide-react";
import { STATUS_COLORS, statusLabel } from "@/lib/order-utils";

const RevenueChart = dynamic(
  () => import("@/components/admin/revenue-chart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son 30 Gün Gelir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    ),
  }
);

interface DashboardData {
  stats: {
    totalRevenue: number;
    monthRevenue: number;
    totalOrders: number;
    pendingOrders: number;
  };
  chartData: { date: string; revenue: number }[];
  topCustomers: {
    userId: string;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    totalMeters: number;
    paymentMethod: string;
    createdAt: string;
    customerName: string;
    customerEmail: string;
  }[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: "Toplam Gelir",
      value: `${formatCurrency(data.stats.totalRevenue)} TL`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-100",
    },
    {
      title: "Bu Ay Gelir",
      value: `${formatCurrency(data.stats.monthRevenue)} TL`,
      icon: CalendarDays,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Toplam Sipariş",
      value: data.stats.totalOrders.toString(),
      icon: Package,
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Bekleyen Sipariş",
      value: data.stats.pendingOrders.toString(),
      icon: Clock,
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={data.chartData} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En İyi Müşteriler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="text-right">Sipariş</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCustomers.map((c) => (
                  <TableRow key={c.userId}>
                    <TableCell>
                      <Link
                        href={`/admin/musteriler/${c.userId}`}
                        className="hover:underline"
                      >
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.orderCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(c.totalSpent)} TL
                    </TableCell>
                  </TableRow>
                ))}
                {data.topCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Henüz müşteri yok
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Son Siparişler</CardTitle>
            <Link
              href="/admin/siparisler"
              className="text-sm text-primary hover:underline"
            >
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/admin/siparisler/${o.id}`}
                        className="hover:underline"
                      >
                        <p className="font-mono text-xs font-medium">
                          {o.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {o.customerName}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${STATUS_COLORS[o.status] || ""}`}
                      >
                        {statusLabel(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatCurrency(o.totalAmount)} TL
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
