import type {
  EFaturaProvider,
  EFaturaSubmitData,
  EFaturaRecipientResult,
  EFaturaSubmitResult,
  EFaturaStatusResult,
  EFaturaCancelResult,
  EFaturaDownloadResult,
} from "../types";

/**
 * Mock e-fatura provider for testing.
 * Always succeeds and returns fake GIB IDs.
 */
export class MockEFaturaProvider implements EFaturaProvider {
  async checkRecipient(taxNumber: string): Promise<EFaturaRecipientResult> {
    // Simulate: tax numbers starting with "1" are registered
    return {
      registered: taxNumber.startsWith("1"),
      alias: taxNumber.startsWith("1") ? `urn:mail:${taxNumber}@efatura.gov.tr` : undefined,
    };
  }

  async submitInvoice(data: EFaturaSubmitData): Promise<EFaturaSubmitResult> {
    const gibId = `GIB-MOCK-${Date.now()}-${data.invoiceNumber}`;
    console.log(`[efatura-mock] Invoice submitted: ${data.invoiceNumber} → ${gibId}`);
    return {
      gibInvoiceId: gibId,
      status: "SENT",
    };
  }

  async getInvoiceStatus(gibInvoiceId: string): Promise<EFaturaStatusResult> {
    console.log(`[efatura-mock] Status check: ${gibInvoiceId}`);
    return {
      status: "ACCEPTED",
    };
  }

  async cancelInvoice(gibInvoiceId: string, reason: string): Promise<EFaturaCancelResult> {
    console.log(`[efatura-mock] Cancel: ${gibInvoiceId} — ${reason}`);
    return { success: true };
  }

  async downloadDocument(invoiceUuid: string, _fileExtension?: string): Promise<EFaturaDownloadResult> {
    console.log(`[efatura-mock] Download: ${invoiceUuid}`);
    return { url: `https://mock-efatura.example.com/download/${invoiceUuid}.pdf` };
  }
}
