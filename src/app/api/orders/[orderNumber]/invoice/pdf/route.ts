import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getInvoicePdfUrl } from "@/services/efatura";

// Public endpoint: customer gets their invoice PDF URL by order number
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        invoices: {
          where: { type: "SATIS", status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order || order.invoices.length === 0) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }

    const invoice = order.invoices[0];
    if (!invoice.gibInvoiceId) {
      return NextResponse.json({ error: "Fatura henüz oluşturulmamış" }, { status: 404 });
    }

    const pdfUrl = await getInvoicePdfUrl(invoice.id);
    return NextResponse.redirect(pdfUrl);
  } catch (error) {
    console.error("Customer invoice PDF error:", error);
    return NextResponse.json({ error: "PDF indirilemedi" }, { status: 500 });
  }
}
