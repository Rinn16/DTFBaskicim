export interface ExportJobData {
  orderId: string;
  orderNumber: string;
  gangSheetId?: string; // Belirli bir gang sheet için (yoksa eski tek-layout akışı)
}

export interface ExportJobResult {
  pngKey: string;
  tiffKey: string;
  pdfKey: string;
  durationMs: number;
  skippedItems: string[];
}
