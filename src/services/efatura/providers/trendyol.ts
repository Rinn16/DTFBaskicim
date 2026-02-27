import type {
  EFaturaProvider,
  EFaturaConfig,
  EFaturaSubmitData,
  EFaturaRecipientResult,
  EFaturaSubmitResult,
  EFaturaStatusResult,
  EFaturaCancelResult,
  EFaturaDownloadResult,
} from "../types";

const BASE_URLS = {
  test: "https://stage-apigateway.trendyolefaturam.com",
  production: "https://apigateway.trendyolecozum.com",
} as const;

interface AuthSession {
  accessToken: string;
  userId: number;
  companyId: number;
}

/**
 * Trendyol E-Faturam adapter.
 *
 * Auth: Single-step signIn with email/password.
 * - x-access-token header → JWT (Bearer token for all requests)
 * - JWT sub → userId
 * - JWT privs first key → companyId
 * - Response body → userId
 *
 * All amounts are in kuruş (cents): 114.55 TL → 11455
 */
export class TrendyolEFaturaProvider implements EFaturaProvider {
  private config: EFaturaConfig;
  private baseUrl: string;
  private session: AuthSession | null = null;
  private tokenExpiresAt = 0;

  constructor(config: EFaturaConfig) {
    this.config = config;
    this.baseUrl = BASE_URLS[config.environment] || BASE_URLS.test;
  }

  /**
   * Sign in and extract userId + companyId.
   * Response headers contain x-access-token, x-refresh-token, etc.
   * Response body contains userId, companyId directly.
   */
  private async signIn(): Promise<AuthSession> {
    const res = await fetch(`${this.baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Trendyol giriş başarısız: ${res.status} — ${errorText}`);
    }

    const accessToken = res.headers.get("x-access-token");
    if (!accessToken) {
      throw new Error("Trendyol giriş: x-access-token header bulunamadı");
    }

    // Parse response body — may contain userId, companyId directly
    const body = await res.json().catch(() => null);

    // Parse JWT payload to extract userId and companyId
    const payloadBase64 = accessToken.split(".")[1];
    const jwtPayload = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));

    // Prefer body values, fallback to JWT
    const userId = body?.userId ?? parseInt(jwtPayload.sub, 10);
    const companyId = body?.companyId ?? parseInt(Object.keys(jwtPayload.privs || {})[0], 10);

    if (!userId || !companyId) {
      throw new Error("Trendyol giriş: userId veya companyId alınamadı");
    }

    return { accessToken, userId, companyId };
  }

  /**
   * Ensure we have a valid session.
   * Re-authenticates if token is expired (JWT exp ~24h, refresh at 50 min).
   */
  private async ensureAuth(): Promise<AuthSession> {
    const now = Date.now();
    if (this.session && now < this.tokenExpiresAt) {
      return this.session;
    }

    this.session = await this.signIn();
    this.tokenExpiresAt = now + 50 * 60 * 1000;
    return this.session;
  }

  private getAuthHeaders(accessToken: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  /** Convert TL amount to kuruş: 114.55 → 11455 */
  private toKurus(amount: number): number {
    return Math.round(amount * 100);
  }

  /** Format phone to match Trendyol pattern: +905XXXXXXXXX */
  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("90") && digits.length >= 12) return `+${digits}`;
    if (digits.startsWith("0") && digits.length >= 11) return `+90${digits.slice(1)}`;
    if (digits.length === 10) return `+90${digits}`;
    return phone.startsWith("+") ? phone : `+${digits}`;
  }

  async checkRecipient(taxNumber: string): Promise<EFaturaRecipientResult> {
    try {
      const auth = await this.ensureAuth();
      const res = await fetch(
        `${this.baseUrl}/api/invoice/taxpayers/${encodeURIComponent(taxNumber)}`,
        { headers: this.getAuthHeaders(auth.accessToken) }
      );

      if (!res.ok) {
        return { registered: false };
      }

      const data = await res.json();
      // API returns array — non-empty means registered
      if (Array.isArray(data) && data.length > 0) {
        return {
          registered: true,
          alias: data[0]?.alias || data[0]?.defaultAlias,
        };
      }
      return { registered: false };
    } catch (error) {
      console.error("[efatura] checkRecipient error:", error);
      return { registered: false };
    }
  }

  async submitInvoice(data: EFaturaSubmitData): Promise<EFaturaSubmitResult> {
    const auth = await this.ensureAuth();

    // Check if buyer is e-fatura registered (B2B vs B2C)
    let recipientRegistered = false;
    let targetAlias: string | undefined;
    if (data.isCorporate && data.buyerTaxNumber) {
      const check = await this.checkRecipient(data.buyerTaxNumber);
      recipientRegistered = check.registered;
      targetAlias = check.alias;
    }

    const taxPercent = data.taxRate;
    const discountKurus = this.toKurus(data.discountAmount);
    const shippingKurus = this.toKurus(data.shippingCost);

    // --- 1. Collect raw line amounts (pre-tax) ---
    interface RawLine {
      grossAmount: number;
      quantity: number;
      unitPrice: number;
      description: string;
    }

    const rawLines: RawLine[] = data.lineItems.map((item) => ({
      grossAmount: this.toKurus(item.total),
      quantity: item.quantity,
      unitPrice: this.toKurus(item.unitPrice),
      description: item.description,
    }));

    // Add shipping as a separate line item for UBL consistency
    if (shippingKurus > 0) {
      rawLines.push({
        grossAmount: shippingKurus,
        quantity: 1,
        unitPrice: shippingKurus,
        description: "Kargo / Teslimat",
      });
    }

    // --- 2. Distribute discount proportionally across lines ---
    const grossTotal = rawLines.reduce((s, l) => s + l.grossAmount, 0);
    const lineDiscounts: number[] = [];
    if (discountKurus > 0 && grossTotal > 0) {
      let remaining = discountKurus;
      for (let i = 0; i < rawLines.length; i++) {
        if (i === rawLines.length - 1) {
          lineDiscounts.push(remaining);
        } else {
          const share = Math.round(discountKurus * rawLines[i].grossAmount / grossTotal);
          lineDiscounts.push(share);
          remaining -= share;
        }
      }
    } else {
      rawLines.forEach(() => lineDiscounts.push(0));
    }

    // --- 3. Build final invoice lines with correct tax ---
    const invoiceLines = rawLines.map((raw, i) => {
      const discount = lineDiscounts[i];
      const taxableAmount = raw.grossAmount - discount;
      const taxAmount = Math.round(taxableAmount * taxPercent / 100);

      return {
        unitCode: "C62",
        quantity: raw.quantity,
        totalAmount: raw.grossAmount,
        taxAmount,
        taxableAmount,
        taxPercent,
        taxName: "KDV",
        taxCode: "0015",
        itemName: raw.description,
        unitPriceAmount: raw.unitPrice,
        totalDiscountAmount: discount,
        totalTax: {
          totalTaxAmount: taxAmount,
          subTotalTaxes: [{
            taxableAmount,
            taxAmount,
            taxType: "KDV",
            percent: taxPercent,
            name: "KDV",
          }],
        },
      };
    });

    // --- 4. Calculate invoice totals from line items (ensures UBL consistency) ---
    const lineExtensionAmount = grossTotal;
    const allowanceTotalAmount = lineDiscounts.reduce((s, d) => s + d, 0);
    const taxExclusiveAmount = lineExtensionAmount - allowanceTotalAmount;
    const totalTaxAmount = invoiceLines.reduce((s, l) => s + l.taxAmount, 0);
    const taxInclusiveAmount = taxExclusiveAmount + totalTaxAmount;

    const totalTax = {
      totalTaxAmount,
      subTotalTaxes: [{
        taxableAmount: taxExclusiveAmount,
        taxAmount: totalTaxAmount,
        taxType: "KDV",
        percent: taxPercent,
        name: "KDV",
      }],
    };

    // --- 5. Build recipientInfo with proper field validation ---
    const buyerDisplayName = data.buyerName && data.buyerName.length >= 2 ? data.buyerName : "Müşteri";

    const recipientInfo: Record<string, unknown> = {
      taxId: data.buyerTaxNumber || "11111111111",
      countryCode: "TR",
      city: data.buyerCity && data.buyerCity.length >= 2 ? data.buyerCity : "Bursa",
      name: buyerDisplayName,
    };
    // surname only for individuals, must be ≥ 2 chars
    if (!data.isCorporate && data.buyerSurname && data.buyerSurname.length >= 2) {
      recipientInfo.surname = data.buyerSurname;
    }
    if (data.buyerDistrict && data.buyerDistrict.length >= 2) {
      recipientInfo.district = data.buyerDistrict;
    }
    if (data.buyerAddress && data.buyerAddress.length >= 2) {
      recipientInfo.address = data.buyerAddress;
    }
    if (data.buyerPostalCode && /^\d{5}$/.test(data.buyerPostalCode)) {
      recipientInfo.postalCode = data.buyerPostalCode;
    }
    if (data.buyerPhone) {
      const formatted = this.formatPhone(data.buyerPhone);
      if (/^\+?[0-9]{7,15}$/.test(formatted)) {
        recipientInfo.phone = formatted;
      }
    }
    if (data.buyerEmail && data.buyerEmail.length >= 2 && data.buyerEmail.includes("@")) {
      recipientInfo.email = data.buyerEmail;
    }
    if (data.buyerTaxOffice && data.buyerTaxOffice.length >= 2) {
      recipientInfo.taxOffice = data.buyerTaxOffice;
    }

    // --- 6. Build payload ---
    const isEArchive = !recipientRegistered;
    const prefix = isEArchive
      ? (data.earsivPrefix || "DAP")
      : (data.efaturaPrefix || "DIP");

    // Build notes array
    const notes = (data.notes && data.notes.length > 0) ? data.notes : [];

    // Add website to recipientInfo if provided
    if (data.sellerWebsite) {
      recipientInfo.website = data.sellerWebsite;
    }

    const payload: Record<string, unknown> = {
      autoInvoiceId: true,
      companyId: auth.companyId,
      userId: auth.userId,
      source: "PORTAL",
      prefix,
      notes,
      recipientInfo,
      invoiceInfo: {
        invoiceType: isEArchive ? "EARSIVFATURA" : "TEMELFATURA",
        invoiceTypeCode: data.invoiceType === "IADE" ? "IADE" : "SATIS",
      },
      invoiceLines,
      totalTax,
      invoiceTotal: {
        lineExtensionAmount,
        taxExclusiveAmount,
        taxInclusiveAmount,
        payableAmount: taxInclusiveAmount,
        allowanceTotalAmount,
      },
      issuedAt: data.invoiceDate.toISOString(),
    };

    // targetAlias is a top-level field, not inside invoiceInfo
    if (recipientRegistered && targetAlias) {
      payload.targetAlias = targetAlias;
    }

    const endpoint = isEArchive
      ? `${this.baseUrl}/api/invoice/documents/earchive`
      : `${this.baseUrl}/api/invoice/documents/outgoing-einvoice`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: this.getAuthHeaders(auth.accessToken),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[efatura] submitInvoice error:", res.status, errorText);
      throw new Error(`E-Fatura gönderimi başarısız: ${res.status} — ${errorText}`);
    }

    const result = await res.json();
    return {
      gibInvoiceId: result.invoiceUuid || result.id?.toString(),
      gibInvoiceNumber: result.invoiceId || undefined,
      status: "SENT",
    };
  }

  async getInvoiceStatus(gibInvoiceId: string): Promise<EFaturaStatusResult> {
    const auth = await this.ensureAuth();

    // Try e-arşiv status first, then e-fatura
    let res = await fetch(
      `${this.baseUrl}/api/invoice/documents/earchive/status/${encodeURIComponent(gibInvoiceId)}`,
      { headers: this.getAuthHeaders(auth.accessToken) }
    );

    if (!res.ok) {
      res = await fetch(
        `${this.baseUrl}/api/invoice/documents/outgoing-einvoice/status/${encodeURIComponent(gibInvoiceId)}`,
        { headers: this.getAuthHeaders(auth.accessToken) }
      );
    }

    if (!res.ok) {
      throw new Error(`E-Fatura durum sorgusu başarısız: ${res.status}`);
    }

    const data = await res.json();

    const statusMap: Record<number, string> = {
      10: "PROCESSING",
      20: "PROCESSING",
      29: "ERROR",
      30: "CREATED",
      40: "SENT",
      50: "WAITING_RESPONSE",
      100: "REJECTING",
      105: "REJECTED",
      200: "APPROVING",
      205: "ACCEPTED",
      305: "CANCELLED",
      405: "ERROR",
    };

    const status = statusMap[data.status] || data.gibStatus || "SENT";
    return { status, rejectionReason: data.rejectionReason };
  }

  async cancelInvoice(gibInvoiceId: string, _reason: string): Promise<EFaturaCancelResult> {
    const auth = await this.ensureAuth();

    const res = await fetch(`${this.baseUrl}/api/invoice/documents/earchive/cancel`, {
      method: "POST",
      headers: this.getAuthHeaders(auth.accessToken),
      body: JSON.stringify({
        invoiceUuid: gibInvoiceId,
        companyId: auth.companyId,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`E-Fatura iptal başarısız: ${res.status} — ${errorText}`);
    }

    return { success: true };
  }

  async downloadDocument(invoiceUuid: string, fileExtension: string = "pdf"): Promise<EFaturaDownloadResult> {
    const auth = await this.ensureAuth();

    const res = await fetch(`${this.baseUrl}/api/invoice/documents/download/permanent-url`, {
      method: "POST",
      headers: this.getAuthHeaders(auth.accessToken),
      body: JSON.stringify({
        documentType: "EARCHIVE",
        fileExtension,
        invoiceUuid,
        companyId: auth.companyId,
      }),
    });

    if (!res.ok) {
      // Try EINVOICE if EARCHIVE fails
      const res2 = await fetch(`${this.baseUrl}/api/invoice/documents/download/permanent-url`, {
        method: "POST",
        headers: this.getAuthHeaders(auth.accessToken),
        body: JSON.stringify({
          documentType: "EINVOICE",
          fileExtension,
          invoiceUuid,
          companyId: auth.companyId,
        }),
      });

      if (!res2.ok) {
        const errorText = await res2.text();
        throw new Error(`Doküman indirme başarısız: ${res2.status} — ${errorText}`);
      }

      const text2 = await res2.text();
      try {
        const data2 = JSON.parse(text2);
        return { url: data2.url || text2 };
      } catch {
        return { url: text2 };
      }
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { url: data.url || text };
    } catch {
      return { url: text };
    }
  }
}
