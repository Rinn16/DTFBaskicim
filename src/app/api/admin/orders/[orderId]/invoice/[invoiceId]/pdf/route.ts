import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getInvoicePdfUrl } from "@/services/efatura";

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

    if (!invoice.gibInvoiceId) {
      return NextResponse.json({ error: "Fatura henüz GİB'e gönderilmemiş" }, { status: 400 });
    }

    const pdfUrl = await getInvoicePdfUrl(invoiceId);
    return NextResponse.json({ url: pdfUrl });
  } catch (error) {
    console.error("Invoice PDF download error:", error);
    const message = error instanceof Error ? error.message : "PDF indirilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
