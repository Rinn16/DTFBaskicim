import { db } from "@/lib/db";
import { INVOICE } from "@/lib/constants";
import { submitInvoiceToGib } from "@/services/efatura";
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

  // Load order with address for billingSameAddress fallback
  const order = await client.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, gangSheets: true, address: true, user: true },
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
      billingFullName: order.billingFullName || (order.billingSameAddress ? (order.address?.fullName || order.user?.name || null) : null),
      billingCompanyName: order.billingCompanyName,
      billingTaxOffice: order.billingTaxOffice,
      billingTaxNumber: order.billingTaxNumber,
      billingAddress: order.billingAddress || (order.billingSameAddress ? (order.address?.address || null) : null),
      billingCity: order.billingCity || (order.billingSameAddress ? (order.address?.city || null) : null),
      billingDistrict: order.billingDistrict || (order.billingSameAddress ? (order.address?.district || null) : null),
      billingZipCode: order.billingZipCode || (order.billingSameAddress ? (order.address?.zipCode || null) : null),

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
 * Full pipeline: create invoice record → submit to Trendyol → mark as ISSUED.
 * PDF is available via Trendyol's permanent download URL (see downloadInvoicePdf).
 */
export async function issueInvoice(orderId: string, type: InvoiceType = "SATIS") {
  // Create invoice record (handles idempotency)
  const invoice = await db.$transaction(async (tx) => {
    return createInvoiceForOrder(orderId, type, tx);
  });

  // If already sent to GIB, skip
  if (invoice.gibInvoiceId) {
    return invoice;
  }

  // Submit to Trendyol E-Faturam
  const result = await submitInvoiceToGib(invoice.id);

  // Create audit trail
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  await db.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus: order.status,
      note: `Fatura oluşturuldu ve GİB'e gönderildi: ${invoice.invoiceNumber}`,
      eventType: "INVOICE",
    },
  });

  return result;
}
