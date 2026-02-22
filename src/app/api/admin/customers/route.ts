import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

    const where: Prisma.UserWhereInput = { role: "CUSTOMER" };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { surname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          phone: true,
          companyName: true,
          createdAt: true,
          specialPricing: { select: { pricePerMeter: true } },
          _count: { select: { orders: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    // Get total spent per customer
    const customerIds = customers.map((c) => c.id);
    const spentData =
      customerIds.length > 0
        ? await db.order.groupBy({
            by: ["userId"],
            _sum: { totalAmount: true },
            where: { userId: { in: customerIds }, paymentStatus: "COMPLETED" },
          })
        : [];

    const spentMap = new Map(
      spentData.map((s) => [s.userId, Number(s._sum.totalAmount || 0)]),
    );

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        surname: c.surname,
        email: c.email,
        phone: c.phone,
        companyName: c.companyName,
        createdAt: c.createdAt,
        orderCount: c._count.orders,
        totalSpent: spentMap.get(c.id) || 0,
        specialPrice: c.specialPricing
          ? Number(c.specialPricing.pricePerMeter)
          : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin customers error:", error);
    return NextResponse.json({ error: "Müşteriler yüklenemedi" }, { status: 500 });
  }
}
