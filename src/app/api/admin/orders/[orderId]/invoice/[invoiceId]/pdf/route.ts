import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadFromS3 } from "@/lib/s3";

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

    if (!invoice || !invoice.pdfKey) {
      return NextResponse.json({ error: "Fatura PDF bulunamadı" }, { status: 404 });
    }

    const pdfBuffer = await downloadFromS3(invoice.pdfKey);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF download error:", error);
    return NextResponse.json({ error: "PDF indirilemedi" }, { status: 500 });
  }
}
