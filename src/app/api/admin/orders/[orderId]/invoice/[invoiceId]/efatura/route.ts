import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitInvoiceToGib, checkGibStatus } from "@/services/efatura";

// POST: Submit invoice to GIB
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; invoiceId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId, invoiceId } = await params;

    // Verify invoice belongs to order
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, orderId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }

    const result = await submitInvoiceToGib(invoiceId);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("E-Fatura submit error:", error);
    const message = error instanceof Error ? error.message : "E-Fatura gönderilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Check GIB status
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string; invoiceId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId, invoiceId } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, orderId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }

    const result = await checkGibStatus(invoiceId);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("E-Fatura status error:", error);
    const message = error instanceof Error ? error.message : "Durum sorgulanamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
