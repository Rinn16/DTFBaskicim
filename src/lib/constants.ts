// DTF Roll Configuration
export const ROLL_CONFIG = {
  /** Total roll width in cm */
  ROLL_WIDTH_CM: 60,
  /** Printable area width in cm */
  PRINT_WIDTH_CM: 57,
  /** Export resolution (dots per inch) */
  DPI: 300,
  /** Pixels per cm at export DPI */
  PX_PER_CM: 300 / 2.54, // ~118.11
  /** Canvas width in pixels at export DPI (57cm) */
  CANVAS_WIDTH_PX: Math.round(57 * (300 / 2.54)), // 6732
  /** Minimum visible roll height in cm */
  MIN_HEIGHT_CM: 30,
  /** Gap between designs in cm (for cutting tolerance) */
  GAP_CM: 0.3, // 3mm
  /** Grid spacing in cm */
  GRID_SPACING_CM: 1,
} as const;

// Pricing
export const PRICING = {
  /** KDV (VAT) rate */
  KDV_RATE: 0.20,
  /** Minimum order in meters */
  MIN_ORDER_METERS: 0.3,
} as const;

// File Upload
export const UPLOAD = {
  /** Maximum file size in bytes (50MB) */
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Allowed image MIME types */
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/tiff', 'image/webp'] as const,
  /** Presigned URL expiry in seconds */
  PRESIGN_EXPIRY: 300, // 5 minutes
  /** Thumbnail width in pixels */
  THUMBNAIL_WIDTH: 300,
} as const;

// Bank Transfer Info
export const BANK_INFO = {
  ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || "DTF Baskicim",
  IBAN: process.env.BANK_IBAN || "",
  BANK_NAME: process.env.BANK_NAME || "",
} as const;

// Order
export const ORDER_STATUSES = {
  PENDING_PAYMENT: 'Odeme Bekleniyor',
  PAYMENT_RECEIVED: 'Odeme Alindi',
  PROCESSING: 'Hazirlaniyor',
  PRINTING: 'Basiliyor',
  SHIPPED: 'Kargoya Verildi',
  COMPLETED: 'Tamamlandi',
  CANCELLED: 'Iptal Edildi',
  REFUNDED: 'Iade Edildi',
} as const;
