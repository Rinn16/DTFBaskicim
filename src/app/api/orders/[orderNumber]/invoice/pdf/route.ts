import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getInvoicePdfUrl } from "@/services/efatura";

function formatCurrency(val: number): string {
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateFallbackInvoiceHtml(invoice: {
  invoiceNumber: string;
  createdAt: Date;
  sellerName: string;
  sellerTaxNumber: string;
  sellerTaxOffice: string;
  sellerAddress: string | null;
  sellerCity: string | null;
  sellerPhone: string | null;
  billingType: string;
  billingFullName: string | null;
  billingCompanyName: string | null;
  billingTaxOffice: string | null;
  billingTaxNumber: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingDistrict: string | null;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  shippingCost: number;
  lineItems: { description: string; quantity: number; unitPrice: number; total: number }[];
}, orderNumber: string): string {
  const inv = invoice;
  const date = inv.createdAt.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  const buyerName = inv.billingType === "CORPORATE" ? inv.billingCompanyName : inv.billingFullName;
  const buyerTax = inv.billingType === "CORPORATE" ? `VN: ${inv.billingTaxNumber || "-"} / ${inv.billingTaxOffice || "-"}` : "";
  const buyerAddress = [inv.billingAddress, inv.billingDistrict, inv.billingCity].filter(Boolean).join(", ");

  const rows = inv.lineItems.map((item, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unitPrice)} TL</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.total)} TL</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Fatura ${inv.invoiceNumber}</title>
  <style>
    @media print { body { margin: 0; } @page { margin: 15mm; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #18181b; padding-bottom: 20px; }
    .company-name { font-size: 22px; font-weight: 700; color: #18181b; }
    .invoice-title { font-size: 18px; font-weight: 700; color: #18181b; text-align: right; }
    .invoice-meta { font-size: 12px; color: #6b7280; text-align: right; margin-top: 4px; }
    .parties { display: flex; gap: 40px; margin-bottom: 30px; }
    .party { flex: 1; }
    .party-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .party-name { font-size: 14px; font-weight: 600; color: #18181b; }
    .party-info { font-size: 12px; color: #6b7280; margin-top: 2px; }
    th { background: #f9fafb; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; text-align: left; }
    .totals { margin-top: 20px; margin-left: auto; width: 300px; }
    .totals tr td { padding: 6px 12px; font-size: 13px; }
    .totals tr.total td { font-weight: 700; font-size: 16px; border-top: 2px solid #18181b; padding-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${inv.sellerName}</div>
      <div class="party-info">VN: ${inv.sellerTaxNumber} / ${inv.sellerTaxOffice}</div>
      ${inv.sellerAddress ? `<div class="party-info">${inv.sellerAddress}${inv.sellerCity ? `, ${inv.sellerCity}` : ""}</div>` : ""}
      ${inv.sellerPhone ? `<div class="party-info">Tel: ${inv.sellerPhone}</div>` : ""}
    </div>
    <div>
      <div class="invoice-title">FATURA</div>
      <div class="invoice-meta">${inv.invoiceNumber}</div>
      <div class="invoice-meta">${date}</div>
      <div class="invoice-meta">Sipariş: ${orderNumber}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Alici</div>
      <div class="party-name">${buyerName || "-"}</div>
      ${buyerTax ? `<div class="party-info">${buyerTax}</div>` : ""}
      ${buyerAddress ? `<div class="party-info">${buyerAddress}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Aciklama</th>
        <th style="width:60px;text-align:center;">Miktar</th>
        <th style="width:120px;text-align:right;">Birim Fiyat</th>
        <th style="width:120px;text-align:right;">Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Ara Toplam</td><td style="text-align:right;">${formatCurrency(inv.subtotal)} TL</td></tr>
    ${inv.discountAmount > 0 ? `<tr><td>Indirim</td><td style="text-align:right;color:#059669;">-${formatCurrency(inv.discountAmount)} TL</td></tr>` : ""}
    ${inv.shippingCost > 0 ? `<tr><td>Kargo</td><td style="text-align:right;">${formatCurrency(inv.shippingCost)} TL</td></tr>` : ""}
    <tr><td>KDV (%${inv.taxRate})</td><td style="text-align:right;">${formatCurrency(inv.taxAmount)} TL</td></tr>
    <tr class="total"><td>Toplam</td><td style="text-align:right;">${formatCurrency(inv.totalAmount)} TL</td></tr>
  </table>

  <div class="footer">
    Bu belge bilgilendirme amaclidir. Resmi e-fatura/e-arsiv belgesi icin sistem uzerinden talepte bulunabilirsiniz.
  </div>
</body>
</html>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const session = await auth();
    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        userId: true,
        guestEmail: true,
        orderNumber: true,
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

    // Authorization check
    if (order.userId) {
      if (!session?.user?.id || (session.user.id !== order.userId && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
      }
    } else if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const invoice = order.invoices[0];

    // If e-fatura PDF is available, redirect to it
    if (invoice.gibInvoiceId) {
      try {
        const pdfUrl = await getInvoicePdfUrl(invoice.id);
        return NextResponse.redirect(pdfUrl);
      } catch {
        // Fall through to HTML invoice
      }
    }

    // Generate fallback HTML invoice
    const lineItems = (invoice.lineItems as { description: string; quantity: number; unitPrice: number; total: number }[]) || [];

    const html = generateFallbackInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      sellerName: invoice.sellerName,
      sellerTaxNumber: invoice.sellerTaxNumber,
      sellerTaxOffice: invoice.sellerTaxOffice,
      sellerAddress: invoice.sellerAddress,
      sellerCity: invoice.sellerCity,
      sellerPhone: invoice.sellerPhone,
      billingType: invoice.billingType,
      billingFullName: invoice.billingFullName,
      billingCompanyName: invoice.billingCompanyName,
      billingTaxOffice: invoice.billingTaxOffice,
      billingTaxNumber: invoice.billingTaxNumber,
      billingAddress: invoice.billingAddress,
      billingCity: invoice.billingCity,
      billingDistrict: invoice.billingDistrict,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      shippingCost: Number(invoice.shippingCost),
      lineItems,
    }, order.orderNumber);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Customer invoice PDF error:", error);
    return NextResponse.json({ error: "Fatura yüklenemedi" }, { status: 500 });
  }
}
