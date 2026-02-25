import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueInvoice } from "@/services/invoice.service";

// GET: List invoices for an order
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;
    const invoices = await db.invoice.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json({ error: "Faturalar yüklenemedi" }, { status: 500 });
  }
}

// POST: Create and issue an invoice for an order
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;

    // Verify order exists
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const invoice = await issueInvoice(orderId);
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Invoice create error:", error);
    const message = error instanceof Error ? error.message : "Fatura oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
