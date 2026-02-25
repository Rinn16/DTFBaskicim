import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadFromS3 } from "@/lib/s3";

// Public endpoint: customer downloads their invoice PDF by order number
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
    if (!invoice.pdfKey) {
      return NextResponse.json({ error: "Fatura PDF henüz oluşturulmamış" }, { status: 404 });
    }

    const pdfBuffer = await downloadFromS3(invoice.pdfKey);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Customer invoice PDF error:", error);
    return NextResponse.json({ error: "PDF indirilemedi" }, { status: 500 });
  }
}
