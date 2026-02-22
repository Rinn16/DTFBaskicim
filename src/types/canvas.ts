export interface UploadedImage {
  id: string;
  file?: File;
  imageKey: string; // S3 key
  imageName: string;
  thumbnailUrl: string;
  originalUrl: string;
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
  sourceImageId?: string; // kopya ise orijinal gorsel ID'si
  /** Small base64 data-URL thumbnail for localStorage persistence */
  persistedThumbnail?: string;
}

export interface Placement {
  id: string;
  imageId: string;
  x: number; // cm from left
  y: number; // cm from top
  widthCm: number;   // her zaman orijinal boyut (rotasyon oncesi)
  heightCm: number;
  rotation: number;   // 0 veya 90 derece
}

export interface DesignInput {
  id: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
}

export interface PackResult {
  placements: Placement[];
  totalHeightCm: number;
  totalMeters: number;
  wastePercent: number;
}

export interface DesignDraftData {
  uploadedImages: Omit<UploadedImage, 'file'>[];
  placements: Placement[];
  autoPlaceQuantities: Record<string, number>;
  gapCm: number;
}

export interface GangSheetLayout {
  items: GangSheetItem[];
  totalHeightCm: number;
  totalWidthCm: number;
}

export interface GangSheetItem {
  imageKey: string;
  imageName: string;
  originalWidthPx: number;
  originalHeightPx: number;
  originalUrl?: string;
  placements: {
    x: number;
    y: number;
    widthCm: number;
    heightCm: number;
    rotation: number;
  }[];
}
