import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run queries in parallel
    const [
      totalRevenueResult,
      monthRevenueResult,
      totalOrders,
      pendingOrders,
      recentOrders,
      dailyRevenue,
      topCustomers,
    ] = await Promise.all([
      // Total revenue (completed payments only)
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "COMPLETED" },
      }),

      // This month's revenue
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
      }),

      // Total orders
      db.order.count(),

      // Pending orders
      db.order.count({
        where: {
          status: { in: ["PENDING_PAYMENT", "PROCESSING"] },
        },
      }),

      // Recent 10 orders
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          totalMeters: true,
          paymentMethod: true,
          createdAt: true,
          user: { select: { name: true, surname: true, email: true } },
          guestName: true,
          guestEmail: true,
        },
      }),

      // Daily revenue last 30 days
      db.order.groupBy({
        by: ["createdAt"],
        _sum: { totalAmount: true },
        where: {
          paymentStatus: "COMPLETED",
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Top 5 customers by spending
      db.order.groupBy({
        by: ["userId"],
        _sum: { totalAmount: true },
        _count: { id: true },
        where: {
          userId: { not: null },
          paymentStatus: "COMPLETED",
        },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 5,
      }),
    ]);

    // Fetch user details for top customers
    const topCustomerIds = topCustomers
      .map((c) => c.userId)
      .filter((id): id is string => id !== null);

    const customerUsers = topCustomerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: topCustomerIds } },
          select: { id: true, name: true, surname: true, email: true },
        })
      : [];

    const userMap = new Map(customerUsers.map((u) => [u.id, u]));

    // Aggregate daily revenue by date (groupBy returns per-row, need to aggregate by day)
    const dailyMap = new Map<string, number>();
    for (const row of dailyRevenue) {
      const dateKey = new Date(row.createdAt).toISOString().slice(0, 10);
      const existing = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, existing + Number(row._sum.totalAmount || 0));
    }

    // Fill in missing days with 0
    const chartData: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      chartData.push({ date: key, revenue: dailyMap.get(key) || 0 });
    }

    return NextResponse.json({
      stats: {
        totalRevenue: Number(totalRevenueResult._sum.totalAmount || 0),
        monthRevenue: Number(monthRevenueResult._sum.totalAmount || 0),
        totalOrders,
        pendingOrders,
      },
      chartData,
      topCustomers: topCustomers.map((c) => {
        const user = c.userId ? userMap.get(c.userId) : null;
        return {
          userId: c.userId,
          name: user ? `${user.name} ${user.surname}` : "Bilinmiyor",
          email: user?.email || "",
          orderCount: c._count.id,
          totalSpent: Number(c._sum.totalAmount || 0),
        };
      }),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        totalMeters: Number(o.totalMeters),
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        customerName: o.user
          ? `${o.user.name} ${o.user.surname}`
          : o.guestName || "Misafir",
        customerEmail: o.user?.email || o.guestEmail || "",
      })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Dashboard yüklenemedi" }, { status: 500 });
  }
}
