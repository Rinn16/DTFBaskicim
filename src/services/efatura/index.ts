import { db } from "@/lib/db";
import type { EFaturaProvider, EFaturaSubmitData } from "./types";
import { TrendyolEFaturaProvider } from "./providers/trendyol";
import { MockEFaturaProvider } from "./providers/mock";

let _provider: EFaturaProvider | null = null;

/**
 * Get the configured e-fatura provider from SiteSettings.
 * Returns null if e-fatura is disabled.
 */
async function getProvider(): Promise<EFaturaProvider | null> {
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings?.efaturaEnabled) return null;

  if (!settings.efaturaEmail || !settings.efaturaPassword) {
    console.warn("[efatura] E-fatura enabled but credentials missing");
    return null;
  }

  // Use mock in development
  if (process.env.NODE_ENV === "development" && process.env.EFATURA_USE_MOCK === "true") {
    return new MockEFaturaProvider();
  }

  // Cache the provider instance
  if (!_provider) {
    _provider = new TrendyolEFaturaProvider({
      environment: (settings.efaturaEnvironment as "test" | "production") || "test",
      email: settings.efaturaEmail,
      password: settings.efaturaPassword,
    });
  }

  return _provider;
}

/** Reset cached provider (call when settings change) */
export function resetEFaturaProvider() {
  _provider = null;
}

/**
 * Submit an invoice to GIB via the configured e-fatura provider.
 */
export async function submitInvoiceToGib(invoiceId: string) {
  const provider = await getProvider();
  if (!provider) {
    throw new Error("E-Fatura sistemi aktif değil veya kimlik bilgileri eksik");
  }

  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { order: { include: { user: true, address: true } } },
  });

  if (invoice.gibInvoiceId) {
    throw new Error("Bu fatura zaten GİB'e gönderilmiş");
  }

  const lineItems = invoice.lineItems as { description: string; quantity: number; unitPrice: number; total: number }[];

  // Load site settings for website & notes
  const siteSettings = await db.siteSettings.findUnique({ where: { id: "default" } });

  // When billingSameAddress=true, billing fields on Invoice are null.
  // Fall back to shipping address from order.address relation.
  const shippingAddr = invoice.order.address;
  const user = invoice.order.user;

  const notes: string[] = [];
  if (siteSettings?.invoiceNotes) {
    const rendered = siteSettings.invoiceNotes
      .replace(/\{siparisNo\}/gi, invoice.order.orderNumber)
      .replace(/\{faturaNo\}/gi, invoice.invoiceNumber);
    notes.push(rendered);
  }

  const submitData: EFaturaSubmitData = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.issuedAt || invoice.createdAt,
    invoiceType: invoice.type,

    sellerName: invoice.sellerName,
    sellerTaxNumber: invoice.sellerTaxNumber,
    sellerTaxOffice: invoice.sellerTaxOffice,
    sellerAddress: invoice.sellerAddress || undefined,
    sellerCity: invoice.sellerCity || undefined,
    sellerWebsite: siteSettings?.invoiceCompanyWebsite || undefined,

    earsivPrefix: siteSettings?.efaturaEarsivPrefix || "DAP",
    efaturaPrefix: siteSettings?.efaturaEfaturaPrefix || "DIP",

    notes: notes.length > 0 ? notes : undefined,

    buyerName: invoice.billingType === "CORPORATE"
      ? (invoice.billingCompanyName || "")
      : (invoice.billingFirstName || user?.name || ""),
    buyerSurname: invoice.billingType === "CORPORATE"
      ? ""
      : (invoice.billingLastName || user?.surname || ""),
    buyerTaxNumber: invoice.billingTaxNumber || undefined,
    buyerTaxOffice: invoice.billingTaxOffice || undefined,
    buyerAddress: invoice.billingAddress || shippingAddr?.address || undefined,
    buyerCity: invoice.billingCity || shippingAddr?.city || undefined,
    buyerDistrict: invoice.billingDistrict || shippingAddr?.district || undefined,
    buyerPostalCode: invoice.billingZipCode || shippingAddr?.zipCode || undefined,
    buyerEmail: user?.email || invoice.order.guestEmail || undefined,
    buyerPhone: user?.phone || shippingAddr?.phone || invoice.order.guestPhone || undefined,
    isCorporate: invoice.billingType === "CORPORATE",

    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    shippingCost: Number(invoice.shippingCost),

    lineItems,
  };

  const result = await provider.submitInvoice(submitData);

  // Update invoice with GIB info and real invoice number
  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      gibInvoiceId: result.gibInvoiceId,
      gibStatus: result.status,
      status: "SENT_TO_GIB",
      ...(result.gibInvoiceNumber && { invoiceNumber: result.gibInvoiceNumber }),
    },
  });

  // Audit trail
  await db.orderStatusHistory.create({
    data: {
      orderId: invoice.orderId,
      fromStatus: invoice.order.status,
      toStatus: invoice.order.status,
      note: `E-Fatura GIB'e gonderildi: ${result.gibInvoiceId}`,
      eventType: "INVOICE",
    },
  });

  return result;
}

/**
 * Check GIB status for an invoice.
 */
export async function checkGibStatus(invoiceId: string) {
  const provider = await getProvider();
  if (!provider) {
    throw new Error("E-Fatura sistemi aktif değil");
  }

  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });

  if (!invoice.gibInvoiceId) {
    throw new Error("Bu fatura henüz GİB'e gönderilmemiş");
  }

  const result = await provider.getInvoiceStatus(invoice.gibInvoiceId);

  // Update invoice status
  const statusMap: Record<string, string> = {
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    SENT: "SENT_TO_GIB",
  };

  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      gibStatus: result.status,
      ...(statusMap[result.status] && { status: statusMap[result.status] as "ACCEPTED" | "REJECTED" | "SENT_TO_GIB" }),
    },
  });

  return result;
}

/**
 * Cancel an e-archive invoice on GIB.
 * Only e-arşiv invoices can be cancelled. E-fatura invoices cannot be cancelled via API.
 */
export async function cancelGibInvoice(invoiceId: string) {
  const provider = await getProvider();
  if (!provider) {
    throw new Error("E-Fatura sistemi aktif değil");
  }

  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { order: true },
  });

  if (!invoice.gibInvoiceId) {
    throw new Error("Bu fatura henüz GİB'e gönderilmemiş");
  }

  if (invoice.billingType === "CORPORATE") {
    // Check if it was actually sent as e-fatura (registered recipient)
    // For safety, we still attempt cancel — Trendyol will reject if it's e-fatura
  }

  const result = await provider.cancelInvoice(invoice.gibInvoiceId, "İptal");

  if (result.success) {
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "CANCELLED",
        gibStatus: "CANCELLED",
      },
    });

    // Audit trail
    await db.orderStatusHistory.create({
      data: {
        orderId: invoice.orderId,
        fromStatus: invoice.order.status,
        toStatus: invoice.order.status,
        note: `E-Fatura iptal edildi: ${invoice.invoiceNumber}`,
        eventType: "INVOICE",
      },
    });
  }

  return result;
}

/**
 * Get permanent PDF download URL for an invoice from Trendyol.
 */
export async function getInvoicePdfUrl(invoiceId: string) {
  const provider = await getProvider();
  if (!provider) {
    throw new Error("E-Fatura sistemi aktif değil");
  }

  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });

  if (!invoice.gibInvoiceId) {
    throw new Error("Bu fatura henüz GİB'e gönderilmemiş");
  }

  const result = await provider.downloadDocument(invoice.gibInvoiceId, "pdf");
  return result.url;
}
