import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        companyName: true,
        taxNumber: true,
        createdAt: true,
        specialPricing: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            totalMeters: true,
            createdAt: true,
          },
        },
        addresses: {
          select: {
            id: true,
            title: true,
            city: true,
            district: true,
            isDefault: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
    }

    const totalSpent = user.orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    return NextResponse.json({
      customer: {
        ...user,
        specialPricing: user.specialPricing
          ? {
              id: user.specialPricing.id,
              pricePerMeter: Number(user.specialPricing.pricePerMeter),
              notes: user.specialPricing.notes,
            }
          : null,
        orders: user.orders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount),
          totalMeters: Number(o.totalMeters),
        })),
        totalSpent,
      },
    });
  } catch (error) {
    console.error("Admin customer detail error:", error);
    return NextResponse.json({ error: "Müşteri yüklenemedi" }, { status: 500 });
  }
}
