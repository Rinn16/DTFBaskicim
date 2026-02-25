import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePdf } from "@/services/invoice.service";
import { uploadToS3 } from "@/lib/s3";
import { INVOICE } from "@/lib/constants";

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
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, orderId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }

    // Regenerate PDF
    const pdfBuffer = await generateInvoicePdf(invoiceId);
    const pdfKey = `${INVOICE.S3_PREFIX}/${invoice.invoiceNumber}.pdf`;
    await uploadToS3(pdfKey, pdfBuffer, "application/pdf");

    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: { pdfKey },
    });

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    console.error("Invoice regenerate error:", error);
    return NextResponse.json({ error: "PDF yeniden oluşturulamadı" }, { status: 500 });
  }
}
