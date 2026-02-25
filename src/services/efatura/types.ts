export interface EFaturaSubmitData {
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType: "SATIS" | "IADE";

  // Seller
  sellerName: string;
  sellerTaxNumber: string;
  sellerTaxOffice: string;
  sellerAddress?: string;
  sellerCity?: string;

  // Buyer
  buyerName: string;
  buyerSurname?: string;
  buyerTaxNumber?: string;
  buyerTaxOffice?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerDistrict?: string;
  buyerPostalCode?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  isCorporate: boolean;

  // Amounts
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  shippingCost: number;

  // Line items
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface EFaturaRecipientResult {
  registered: boolean;
  alias?: string;
}

export interface EFaturaSubmitResult {
  gibInvoiceId: string;
  status: string;
}

export interface EFaturaStatusResult {
  status: string;
  rejectionReason?: string;
}

export interface EFaturaCancelResult {
  success: boolean;
}

export interface EFaturaDownloadResult {
  url: string;
}

export interface EFaturaProvider {
  /** Check if recipient is an e-fatura registered taxpayer */
  checkRecipient(taxNumber: string): Promise<EFaturaRecipientResult>;
  /** Submit invoice to GIB */
  submitInvoice(data: EFaturaSubmitData): Promise<EFaturaSubmitResult>;
  /** Query invoice status from GIB */
  getInvoiceStatus(gibInvoiceId: string): Promise<EFaturaStatusResult>;
  /** Cancel an invoice on GIB */
  cancelInvoice(gibInvoiceId: string, reason: string): Promise<EFaturaCancelResult>;
  /** Get permanent PDF download URL */
  downloadDocument(invoiceUuid: string, fileExtension?: string): Promise<EFaturaDownloadResult>;
}

export interface EFaturaConfig {
  environment: "test" | "production";
  email: string;
  password: string;
}
