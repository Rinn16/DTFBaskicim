import sharp from "sharp";
import PDFDocument from "pdfkit";
import { downloadFromS3, uploadToS3 } from "@/lib/s3";
import { ROLL_CONFIG, EXPORT } from "@/lib/constants";
import { getEffectiveDimensions } from "@/lib/placement-utils";
import type { GangSheetLayout } from "@/types/canvas";
import type { ExportJobResult } from "@/types/export";

// Limit memory usage in worker context
sharp.cache(false);
sharp.concurrency(1);

interface ProcessExportParams {
  orderId: string;
  gangSheetLayout: GangSheetLayout;
  gangSheetWidth: number;  // pixels
  gangSheetHeight: number; // pixels
}

export async function processExport(
  params: ProcessExportParams
): Promise<ExportJobResult> {
  const start = Date.now();
  const { orderId, gangSheetLayout, gangSheetWidth, gangSheetHeight } = params;
  const skippedItems: string[] = [];

  // 1. Download unique images from S3 (deduplicate by imageKey)
  const imageKeySet = new Set<string>();
  for (const item of gangSheetLayout.items) {
    if (item.imageKey) {
      imageKeySet.add(item.imageKey);
    } else {
      skippedItems.push(item.imageName || "unknown");
    }
  }

  if (imageKeySet.size === 0) {
    throw new Error("No valid images found in gang sheet layout");
  }

  const imageBuffers = new Map<string, Buffer>();
  for (const key of imageKeySet) {
    const buffer = await downloadFromS3(key);
    imageBuffers.set(key, buffer);
  }

  // 2. Composite — build overlays for each placement
  const compositeInputs: sharp.OverlayOptions[] = [];

  for (const item of gangSheetLayout.items) {
    if (!item.imageKey || !imageBuffers.has(item.imageKey)) continue;

    const srcBuffer = imageBuffers.get(item.imageKey)!;

    for (const placement of item.placements) {
      const effective = getEffectiveDimensions({
        widthCm: placement.widthCm,
        heightCm: placement.heightCm,
        rotation: placement.rotation,
      });

      // Convert cm to pixels at export DPI
      const leftPx = Math.round(placement.x * ROLL_CONFIG.PX_PER_CM);
      const topPx = Math.round(placement.y * ROLL_CONFIG.PX_PER_CM);

      // Resize to placement size (pre-rotation dimensions)
      const resizeWidthPx = Math.round(placement.widthCm * ROLL_CONFIG.PX_PER_CM);
      const resizeHeightPx = Math.round(placement.heightCm * ROLL_CONFIG.PX_PER_CM);

      let processed = sharp(srcBuffer)
        .resize(resizeWidthPx, resizeHeightPx, { fit: "fill" });

      // Apply rotation if needed
      if (placement.rotation === 90) {
        processed = processed.rotate(90);
      } else if (placement.rotation === 270) {
        processed = processed.rotate(270);
      }

      const overlayBuffer = await processed.png().toBuffer();

      compositeInputs.push({
        input: overlayBuffer,
        left: leftPx,
        top: topPx,
      });
    }
  }

  // 3. Create PNG canvas and composite all images
  const pngBuffer = await sharp({
    create: {
      width: gangSheetWidth,
      height: gangSheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeInputs)
    .png({ compressionLevel: EXPORT.PNG_COMPRESSION_LEVEL })
    .toBuffer();

  // 4. Generate TIFF from PNG
  const tiffBuffer = await sharp(pngBuffer)
    .tiff({ compression: EXPORT.TIFF_COMPRESSION })
    .toBuffer();

  // 5. Generate PDF with page size matching physical dimensions
  const pdfBuffer = await generatePdf(
    pngBuffer,
    gangSheetLayout.totalWidthCm,
    gangSheetLayout.totalHeightCm
  );

  // 6. Upload all to S3
  const prefix = `${EXPORT.S3_PREFIX}/${orderId}`;
  const pngKey = `${prefix}/gangsheet.png`;
  const tiffKey = `${prefix}/gangsheet.tiff`;
  const pdfKey = `${prefix}/gangsheet.pdf`;

  await Promise.all([
    uploadToS3(pngKey, pngBuffer, "image/png"),
    uploadToS3(tiffKey, tiffBuffer, "image/tiff"),
    uploadToS3(pdfKey, pdfBuffer, "application/pdf"),
  ]);

  const durationMs = Date.now() - start;

  return { pngKey, tiffKey, pdfKey, durationMs, skippedItems };
}

function generatePdf(
  pngBuffer: Buffer,
  widthCm: number,
  heightCm: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Convert cm to PDF points (1 cm = 28.3465 points)
    const CM_TO_PT = 28.3465;
    const pageWidth = widthCm * CM_TO_PT;
    const pageHeight = heightCm * CM_TO_PT;

    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.image(pngBuffer, 0, 0, {
      width: pageWidth,
      height: pageHeight,
    });

    doc.end();
  });
}
