import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const type = request.nextUrl.searchParams.get("type");

    if (type === "orders") {
      return await exportOrders();
    }
    if (type === "customers") {
      return await exportCustomers();
    }

    return NextResponse.json(
      { error: "Geçersiz export tipi" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export başarısız" }, { status: 500 });
  }
}

async function exportOrders() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, surname: true, email: true } },
    },
  });

  const headers = [
    "Sipariş No",
    "Müşteri",
    "Email",
    "Durum",
    "Toplam Metre",
    "Toplam Tutar",
    "Ödeme Yöntemi",
    "Tarih",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.user
      ? `${o.user.name} ${o.user.surname}`
      : o.guestName || "",
    o.user?.email || o.guestEmail || "",
    o.status,
    Number(o.totalMeters).toFixed(2),
    Number(o.totalAmount).toFixed(2),
    o.paymentMethod || "",
    o.createdAt.toISOString().slice(0, 10),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="siparisler-${Date.now()}.csv"`,
    },
  });
}

async function exportCustomers() {
  const users = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      surname: true,
      email: true,
      phone: true,
      companyName: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        select: { totalAmount: true },
      },
    },
  });

  const headers = [
    "Ad",
    "Soyad",
    "Email",
    "Telefon",
    "Firma",
    "Sipariş Sayısı",
    "Toplam Harcama",
    "Kayıt Tarihi",
  ];

  const rows = users.map((u) => {
    const totalSpent = u.orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    return [
      u.name,
      u.surname,
      u.email || "",
      u.phone || "",
      u.companyName || "",
      u._count.orders.toString(),
      totalSpent.toFixed(2),
      u.createdAt.toISOString().slice(0, 10),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="musteriler-${Date.now()}.csv"`,
    },
  });
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
