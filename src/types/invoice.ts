import type { InvoiceType, InvoiceStatus, TransactionType, TransactionStatus, BillingType } from "@/generated/prisma/client";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  orderId: string;
  type: InvoiceType;
  status: InvoiceStatus;

  sellerName: string;
  sellerTaxNumber: string;
  sellerTaxOffice: string;
  sellerAddress: string | null;
  sellerCity: string | null;
  sellerPhone: string | null;

  billingType: BillingType;
  billingFullName: string | null;
  billingCompanyName: string | null;
  billingTaxOffice: string | null;
  billingTaxNumber: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingDistrict: string | null;
  billingZipCode: string | null;

  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  shippingCost: number;

  lineItems: InvoiceLine[];
  pdfKey: string | null;

  gibInvoiceId: string | null;
  gibStatus: string | null;

  issuedAt: string | null;
  createdAt: string;
}

export interface PaymentTransactionData {
  id: string;
  orderId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  gatewayRef: string | null;
  refundReason: string | null;
  refundedBy: string | null;
  note: string | null;
  createdAt: string;
}
