import type {
  EFaturaProvider,
  EFaturaConfig,
  EFaturaSubmitData,
  EFaturaRecipientResult,
  EFaturaSubmitResult,
  EFaturaStatusResult,
  EFaturaCancelResult,
} from "../types";

/**
 * Trendyol E-Faturam adapter.
 *
 * Auth: Company short code + web service username + web service password.
 * Supports both E-Fatura (B2B) and E-Arşiv (B2C).
 *
 * NOTE: This is a stub implementation. Real API endpoints and request/response
 * formats will be filled in once Trendyol credentials are obtained and their
 * developer documentation is consulted.
 */
export class TrendyolEFaturaProvider implements EFaturaProvider {
  private config: EFaturaConfig;
  private baseUrl = "https://efatura.trendyol.com/api/v1"; // placeholder

  constructor(config: EFaturaConfig) {
    this.config = config;
  }

  private getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString("base64");

    return {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      "X-Company-Code": this.config.companyCode,
    };
  }

  async checkRecipient(taxNumber: string): Promise<EFaturaRecipientResult> {
    try {
      const res = await fetch(
        `${this.baseUrl}/recipient/check?taxNumber=${encodeURIComponent(taxNumber)}`,
        { headers: this.getAuthHeaders() }
      );

      if (!res.ok) {
        console.error("[efatura] checkRecipient failed:", res.status);
        return { registered: false };
      }

      const data = await res.json();
      return {
        registered: data.registered ?? false,
        alias: data.alias,
      };
    } catch (error) {
      console.error("[efatura] checkRecipient error:", error);
      return { registered: false };
    }
  }

  async submitInvoice(data: EFaturaSubmitData): Promise<EFaturaSubmitResult> {
    // Determine if this should be E-Fatura (B2B) or E-Arşiv (B2C)
    let recipientRegistered = false;
    if (data.isCorporate && data.buyerTaxNumber) {
      const check = await this.checkRecipient(data.buyerTaxNumber);
      recipientRegistered = check.registered;
    }

    const endpoint = recipientRegistered
      ? `${this.baseUrl}/einvoice/submit`
      : `${this.baseUrl}/earchive/submit`;

    const payload = {
      companyCode: this.config.companyCode,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate.toISOString(),
      invoiceType: data.invoiceType === "IADE" ? "IADE" : "SATIS",

      seller: {
        name: data.sellerName,
        taxNumber: data.sellerTaxNumber,
        taxOffice: data.sellerTaxOffice,
        address: data.sellerAddress,
        city: data.sellerCity,
      },
      buyer: {
        name: data.buyerName,
        taxNumber: data.buyerTaxNumber,
        taxOffice: data.buyerTaxOffice,
        address: data.buyerAddress,
        city: data.buyerCity,
      },

      amounts: {
        subtotal: data.subtotal,
        discount: data.discountAmount,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        total: data.totalAmount,
        shipping: data.shippingCost,
      },

      lineItems: data.lineItems.map((item, idx) => ({
        lineNumber: idx + 1,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.total,
        taxRate: data.taxRate,
        taxAmount: (item.total * data.taxRate) / 100,
      })),
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`E-Fatura gönderimi başarısız: ${res.status} — ${errorText}`);
    }

    const result = await res.json();
    return {
      gibInvoiceId: result.gibInvoiceId || result.id,
      status: result.status || "SENT",
    };
  }

  async getInvoiceStatus(gibInvoiceId: string): Promise<EFaturaStatusResult> {
    const res = await fetch(
      `${this.baseUrl}/invoice/status/${encodeURIComponent(gibInvoiceId)}`,
      { headers: this.getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error(`E-Fatura durum sorgusu başarısız: ${res.status}`);
    }

    const data = await res.json();
    return {
      status: data.status,
      rejectionReason: data.rejectionReason,
    };
  }

  async cancelInvoice(gibInvoiceId: string, reason: string): Promise<EFaturaCancelResult> {
    const res = await fetch(`${this.baseUrl}/invoice/cancel`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ gibInvoiceId, reason }),
    });

    if (!res.ok) {
      throw new Error(`E-Fatura iptal başarısız: ${res.status}`);
    }

    return { success: true };
  }
}
