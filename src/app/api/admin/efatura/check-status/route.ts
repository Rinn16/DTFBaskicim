import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkGibStatus } from "@/services/efatura";

/**
 * POST /api/admin/efatura/check-status
 * Checks GIB status for all invoices in SENT_TO_GIB state.
 * Returns a summary of updated invoices.
 */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    // Find all invoices that are pending GIB response
    const pendingInvoices = await db.invoice.findMany({
      where: {
        status: "SENT_TO_GIB",
        gibInvoiceId: { not: null },
      },
      select: {
        id: true,
        invoiceNumber: true,
        gibInvoiceId: true,
      },
      take: 50, // Process max 50 at a time to avoid timeouts
    });

    if (pendingInvoices.length === 0) {
      return NextResponse.json({
        message: "GİB yanıtı bekleyen fatura yok.",
        checked: 0,
        updated: 0,
        results: [],
      });
    }

    const results: {
      invoiceNumber: string;
      status: string;
      error?: string;
    }[] = [];
    let updatedCount = 0;

    for (const invoice of pendingInvoices) {
      try {
        const result = await checkGibStatus(invoice.id);
        const changed = result.status !== "SENT";
        if (changed) updatedCount++;

        results.push({
          invoiceNumber: invoice.invoiceNumber,
          status: result.status,
        });
      } catch (err) {
        results.push({
          invoiceNumber: invoice.invoiceNumber,
          status: "ERROR",
          error: err instanceof Error ? err.message : "Bilinmeyen hata",
        });
      }
    }

    return NextResponse.json({
      message: `${pendingInvoices.length} fatura kontrol edildi, ${updatedCount} güncellendi.`,
      checked: pendingInvoices.length,
      updated: updatedCount,
      results,
    });
  } catch (error) {
    console.error("Bulk GIB status check error:", error);
    return NextResponse.json(
      { error: "Durum kontrolü sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
