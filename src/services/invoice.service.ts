import PDFDocument from "pdfkit";
import { db } from "@/lib/db";
import { uploadToS3, downloadFromS3 } from "@/lib/s3";
import { INVOICE } from "@/lib/constants";
import type { InvoiceType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

type PrismaTransaction = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Atomically generate the next invoice number within a transaction.
 * Uses row-level locking via UPDATE to prevent race conditions.
 */
async function getNextInvoiceNumber(tx: PrismaTransaction): Promise<string> {
  const settings = await tx.siteSettings.update({
    where: { id: "default" },
    data: { invoiceNextNumber: { increment: 1 } },
  });

  const prefix = settings.invoicePrefix || "DTF-F";
  const year = new Date().getFullYear();
  const num = String(settings.invoiceNextNumber - 1).padStart(5, "0");
  return `${prefix}-${year}-${num}`;
}

/**
 * Create an invoice record for an order (within the caller's transaction or standalone).
 */
export async function createInvoiceForOrder(
  orderId: string,
  type: InvoiceType = "SATIS",
  tx?: PrismaTransaction
) {
  const client = tx || db;

  // Load order
  const order = await client.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, gangSheets: true },
  });

  // Idempotency: check if a SATIS invoice already exists
  if (type === "SATIS") {
    const existing = await client.invoice.findFirst({
      where: { orderId, type: "SATIS", status: { not: "CANCELLED" } },
    });
    if (existing) return existing;
  }

  // Load seller info from SiteSettings
  let settings = await client.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await client.siteSettings.create({
      data: { id: "default" },
    });
  }

  if (!settings.invoiceCompanyName || !settings.invoiceCompanyTaxNumber || !settings.invoiceCompanyTaxOffice) {
    throw new Error("Fatura firma bilgileri eksik. Lütfen Ayarlar sayfasından doldurun.");
  }

  // Build line items from gang sheets or order items
  const lineItems: { description: string; quantity: number; unitPrice: number; total: number }[] = [];

  if (order.gangSheets && order.gangSheets.length > 0) {
    order.gangSheets.forEach((gs, idx) => {
      const meters = Number(gs.totalMeters);
      const unitPrice = Number(order.pricePerMeter);
      lineItems.push({
        description: `Gang Sheet ${idx + 1} — ${meters.toFixed(2)} metre DTF baskı`,
        quantity: 1,
        unitPrice: meters * unitPrice,
        total: meters * unitPrice,
      });
    });
  } else {
    const meters = Number(order.totalMeters);
    const unitPrice = Number(order.pricePerMeter);
    lineItems.push({
      description: `DTF baskı — ${meters.toFixed(2)} metre`,
      quantity: 1,
      unitPrice: meters * unitPrice,
      total: meters * unitPrice,
    });
  }

  // Financial snapshot
  const subtotal = Number(order.subtotal);
  const discountAmount = Number(order.discountAmount);
  const taxAmount = Number(order.taxAmount);
  const totalAmount = Number(order.totalAmount);
  const shippingCost = Number(order.shippingCost);

  // Generate invoice number atomically
  const invoiceNumber = tx
    ? await getNextInvoiceNumber(tx)
    : await db.$transaction(async (innerTx) => getNextInvoiceNumber(innerTx));

  const invoice = await client.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      type,
      status: "DRAFT",

      sellerName: settings.invoiceCompanyName,
      sellerTaxNumber: settings.invoiceCompanyTaxNumber,
      sellerTaxOffice: settings.invoiceCompanyTaxOffice,
      sellerAddress: settings.invoiceCompanyAddress,
      sellerCity: settings.invoiceCompanyCity,
      sellerPhone: settings.invoiceCompanyPhone,

      billingType: order.billingType,
      billingFullName: order.billingFullName,
      billingCompanyName: order.billingCompanyName,
      billingTaxOffice: order.billingTaxOffice,
      billingTaxNumber: order.billingTaxNumber,
      billingAddress: order.billingAddress,
      billingCity: order.billingCity,
      billingDistrict: order.billingDistrict,
      billingZipCode: order.billingZipCode,

      subtotal,
      discountAmount,
      taxRate: INVOICE.TAX_RATE,
      taxAmount,
      totalAmount,
      shippingCost,
      lineItems: lineItems as unknown as Prisma.InputJsonValue,
    },
  });

  return invoice;
}

/**
 * Generate a Turkish invoice PDF using PDFKit.
 */
export async function generateInvoicePdf(invoiceId: string): Promise<Buffer> {
  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { order: true },
  });

  // Try to load company logo
  let logoBuffer: Buffer | null = null;
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (settings?.invoiceCompanyLogoKey) {
    try {
      logoBuffer = await downloadFromS3(settings.invoiceCompanyLogoKey);
    } catch {
      // Logo not found, proceed without it
    }
  }

  const lineItems = invoice.lineItems as { description: string; quantity: number; unitPrice: number; total: number }[];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 80; // margins
    const leftCol = 40;
    const rightCol = 320;

    // ── Header ──
    let yPos = 40;

    // Logo + Seller info (left)
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, leftCol, yPos, { width: 80 });
      } catch {
        // Skip if image format is unsupported
      }
    }

    const sellerX = logoBuffer ? leftCol + 90 : leftCol;
    doc.font("Helvetica-Bold").fontSize(11).text(invoice.sellerName, sellerX, yPos);
    yPos += 16;
    doc.font("Helvetica").fontSize(8);
    doc.text(`V.D.: ${invoice.sellerTaxOffice}  V.N.: ${invoice.sellerTaxNumber}`, sellerX, yPos);
    yPos += 11;
    if (invoice.sellerAddress) {
      doc.text(invoice.sellerAddress, sellerX, yPos, { width: 200 });
      yPos += 11;
    }
    if (invoice.sellerCity) {
      doc.text(invoice.sellerCity, sellerX, yPos);
      yPos += 11;
    }
    if (invoice.sellerPhone) {
      doc.text(`Tel: ${invoice.sellerPhone}`, sellerX, yPos);
      yPos += 11;
    }

    // Invoice info (right)
    const typeLabel = invoice.type === "IADE" ? "IADE FATURASI" : "SATIS FATURASI";
    doc.font("Helvetica-Bold").fontSize(14).text(typeLabel, rightCol, 40, { width: 220, align: "right" });
    doc.font("Helvetica").fontSize(9);
    doc.text(`Fatura No: ${invoice.invoiceNumber}`, rightCol, 60, { width: 220, align: "right" });
    doc.text(
      `Tarih: ${(invoice.issuedAt || invoice.createdAt).toLocaleDateString("tr-TR")}`,
      rightCol, 72, { width: 220, align: "right" }
    );
    doc.text(`Siparis No: ${invoice.order.orderNumber}`, rightCol, 84, { width: 220, align: "right" });

    // ── Buyer Info ──
    yPos = Math.max(yPos, 110) + 15;
    doc.moveTo(leftCol, yPos).lineTo(leftCol + pageWidth, yPos).stroke("#cccccc");
    yPos += 10;

    doc.font("Helvetica-Bold").fontSize(9).text("ALICI BILGILERI", leftCol, yPos);
    yPos += 14;
    doc.font("Helvetica").fontSize(8);

    if (invoice.billingType === "CORPORATE") {
      if (invoice.billingCompanyName) {
        doc.font("Helvetica-Bold").text(invoice.billingCompanyName, leftCol, yPos);
        doc.font("Helvetica");
        yPos += 12;
      }
      if (invoice.billingTaxOffice && invoice.billingTaxNumber) {
        doc.text(`V.D.: ${invoice.billingTaxOffice}  V.N.: ${invoice.billingTaxNumber}`, leftCol, yPos);
        yPos += 12;
      }
    } else {
      if (invoice.billingFullName) {
        doc.font("Helvetica-Bold").text(invoice.billingFullName, leftCol, yPos);
        doc.font("Helvetica");
        yPos += 12;
      }
    }
    if (invoice.billingAddress) {
      doc.text(invoice.billingAddress, leftCol, yPos, { width: 300 });
      yPos += 12;
    }
    if (invoice.billingCity || invoice.billingDistrict) {
      const loc = [invoice.billingDistrict, invoice.billingCity].filter(Boolean).join("/");
      doc.text(loc + (invoice.billingZipCode ? ` ${invoice.billingZipCode}` : ""), leftCol, yPos);
      yPos += 12;
    }

    // ── Line Items Table ──
    yPos += 10;
    doc.moveTo(leftCol, yPos).lineTo(leftCol + pageWidth, yPos).stroke("#cccccc");
    yPos += 8;

    // Table header
    const colDesc = leftCol;
    const colQty = leftCol + 280;
    const colUnit = leftCol + 330;
    const colTotal = leftCol + 420;

    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("ACIKLAMA", colDesc, yPos, { width: 270 });
    doc.text("ADET", colQty, yPos, { width: 40, align: "right" });
    doc.text("BIRIM FIYAT", colUnit, yPos, { width: 80, align: "right" });
    doc.text("TUTAR", colTotal, yPos, { width: 80, align: "right" });

    yPos += 14;
    doc.moveTo(leftCol, yPos).lineTo(leftCol + pageWidth, yPos).stroke("#eeeeee");
    yPos += 6;

    // Table rows
    doc.font("Helvetica").fontSize(8);
    for (const item of lineItems) {
      doc.text(item.description, colDesc, yPos, { width: 270 });
      doc.text(String(item.quantity), colQty, yPos, { width: 40, align: "right" });
      doc.text(formatCurrency(item.unitPrice), colUnit, yPos, { width: 80, align: "right" });
      doc.text(formatCurrency(item.total), colTotal, yPos, { width: 80, align: "right" });
      yPos += 16;
    }

    // Shipping line
    if (Number(invoice.shippingCost) > 0) {
      doc.text("Kargo", colDesc, yPos, { width: 270 });
      doc.text("1", colQty, yPos, { width: 40, align: "right" });
      doc.text(formatCurrency(Number(invoice.shippingCost)), colUnit, yPos, { width: 80, align: "right" });
      doc.text(formatCurrency(Number(invoice.shippingCost)), colTotal, yPos, { width: 80, align: "right" });
      yPos += 16;
    }

    // ── Totals ──
    yPos += 5;
    doc.moveTo(leftCol, yPos).lineTo(leftCol + pageWidth, yPos).stroke("#cccccc");
    yPos += 10;

    const totalsX = colUnit;
    const totalsValX = colTotal;

    doc.font("Helvetica").fontSize(8);
    doc.text("Ara Toplam:", totalsX, yPos, { width: 80, align: "right" });
    doc.text(formatCurrency(Number(invoice.subtotal)), totalsValX, yPos, { width: 80, align: "right" });
    yPos += 14;

    if (Number(invoice.discountAmount) > 0) {
      doc.text("Indirim:", totalsX, yPos, { width: 80, align: "right" });
      doc.text(`-${formatCurrency(Number(invoice.discountAmount))}`, totalsValX, yPos, { width: 80, align: "right" });
      yPos += 14;
    }

    doc.text(`KDV (%${Number(invoice.taxRate)})`, totalsX, yPos, { width: 80, align: "right" });
    doc.text(formatCurrency(Number(invoice.taxAmount)), totalsValX, yPos, { width: 80, align: "right" });
    yPos += 14;

    if (Number(invoice.shippingCost) > 0) {
      doc.text("Kargo:", totalsX, yPos, { width: 80, align: "right" });
      doc.text(formatCurrency(Number(invoice.shippingCost)), totalsValX, yPos, { width: 80, align: "right" });
      yPos += 14;
    }

    doc.moveTo(totalsX, yPos).lineTo(totalsValX + 80, yPos).stroke("#cccccc");
    yPos += 8;
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("GENEL TOPLAM:", totalsX - 40, yPos, { width: 120, align: "right" });
    doc.text(`${formatCurrency(Number(invoice.totalAmount))} TL`, totalsValX, yPos, { width: 80, align: "right" });

    // ── IBAN ──
    if (settings?.invoiceCompanyIban) {
      yPos += 35;
      doc.font("Helvetica").fontSize(8);
      doc.text(`IBAN: ${settings.invoiceCompanyIban}`, leftCol, yPos);
    }

    doc.end();
  });
}

/**
 * Full pipeline: create invoice record → generate PDF → upload to S3 → mark as ISSUED
 */
export async function issueInvoice(orderId: string, type: InvoiceType = "SATIS") {
  // Create invoice record (handles idempotency)
  const invoice = await db.$transaction(async (tx) => {
    return createInvoiceForOrder(orderId, type, tx);
  });

  // Generate PDF
  const pdfBuffer = await generateInvoicePdf(invoice.id);

  // Upload to S3
  const pdfKey = `${INVOICE.S3_PREFIX}/${invoice.invoiceNumber}.pdf`;
  await uploadToS3(pdfKey, pdfBuffer, "application/pdf");

  // Update invoice status
  const updated = await db.invoice.update({
    where: { id: invoice.id },
    data: {
      pdfKey,
      status: "ISSUED",
      issuedAt: new Date(),
    },
  });

  // Create audit trail
  await db.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus: (await db.order.findUnique({ where: { id: orderId } }))!.status,
      toStatus: (await db.order.findUnique({ where: { id: orderId } }))!.status,
      note: `Fatura olusturuldu: ${invoice.invoiceNumber}`,
      eventType: "INVOICE",
    },
  });

  return updated;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
