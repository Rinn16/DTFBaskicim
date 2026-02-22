export interface ExportJobData {
  orderId: string;
  orderNumber: string;
}

export interface ExportJobResult {
  pngKey: string;
  tiffKey: string;
  pdfKey: string;
  durationMs: number;
  skippedItems: string[];
}
