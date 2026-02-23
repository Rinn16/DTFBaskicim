// Load env BEFORE any other imports that read process.env at module level
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

// Now dynamically import everything that depends on env vars
async function main() {
  const { Worker } = await import("bullmq");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { processExport } = await import("../src/services/export.service");
  const { EXPORT } = await import("../src/lib/constants");
  type GangSheetLayout = import("../src/types/canvas").GangSheetLayout;
  type ExportJobData = import("../src/types/export").ExportJobData;
  type ExportJobResult = import("../src/types/export").ExportJobResult;

  function getRedisConnection() {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      password: parsed.password || undefined,
    };
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const worker = new Worker<ExportJobData, ExportJobResult>(
    EXPORT.QUEUE_NAME,
    async (job) => {
      const { orderId, orderNumber, gangSheetId } = job.data;
      console.log(`[Export] Processing order ${orderNumber} (${orderId})${gangSheetId ? ` gangSheet=${gangSheetId}` : ""}`);

      // Fetch order
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          gangSheetLayout: true,
          gangSheetWidth: true,
          gangSheetHeight: true,
          gangSheets: true,
        },
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Update status to PROCESSING only if not already past that state
      if (order.status === "PENDING_PAYMENT" || order.status === "PROCESSING") {
        if (order.status !== "PROCESSING") {
          await db.$transaction([
            db.order.update({
              where: { id: orderId },
              data: { status: "PROCESSING" },
            }),
            db.orderStatusHistory.create({
              data: {
                orderId,
                fromStatus: order.status,
                toStatus: "PROCESSING",
                note: "Gang sheet export baslatildi",
              },
            }),
          ]);
        }
      }

      // Belirli bir gang sheet mi yoksa tümü mü?
      if (gangSheetId) {
        // Tek bir gang sheet export et
        const gangSheet = order.gangSheets.find((gs) => gs.id === gangSheetId);
        if (!gangSheet) {
          throw new Error(`GangSheet not found: ${gangSheetId}`);
        }

        const result = await processExport({
          orderId,
          gangSheetId: gangSheet.id,
          gangSheetLayout: gangSheet.gangSheetLayout as unknown as GangSheetLayout,
          gangSheetWidth: gangSheet.gangSheetWidth,
          gangSheetHeight: gangSheet.gangSheetHeight,
        });

        await db.orderGangSheet.update({
          where: { id: gangSheet.id },
          data: {
            exportPng: result.pngKey,
            exportTiff: result.tiffKey,
            exportPdf: result.pdfKey,
          },
        });

        console.log(`[Export] GangSheet ${gangSheet.id} completed in ${(result.durationMs / 1000).toFixed(1)}s`);
        if (result.skippedItems.length > 0) {
          console.warn(`[Export] Skipped items: ${result.skippedItems.join(", ")}`);
        }

        return result;
      } else if (order.gangSheets.length > 0) {
        // Tüm gang sheet'leri ayrı ayrı export et
        let totalDuration = 0;
        const allSkipped: string[] = [];
        let lastResult: ExportJobResult | null = null;

        for (const gangSheet of order.gangSheets) {
          const result = await processExport({
            orderId,
            gangSheetId: gangSheet.id,
            gangSheetLayout: gangSheet.gangSheetLayout as unknown as GangSheetLayout,
            gangSheetWidth: gangSheet.gangSheetWidth,
            gangSheetHeight: gangSheet.gangSheetHeight,
          });

          await db.orderGangSheet.update({
            where: { id: gangSheet.id },
            data: {
              exportPng: result.pngKey,
              exportTiff: result.tiffKey,
              exportPdf: result.pdfKey,
            },
          });

          totalDuration += result.durationMs;
          allSkipped.push(...result.skippedItems);
          lastResult = result;

          console.log(`[Export] GangSheet ${gangSheet.id} completed in ${(result.durationMs / 1000).toFixed(1)}s`);
        }

        if (allSkipped.length > 0) {
          console.warn(`[Export] Skipped items: ${allSkipped.join(", ")}`);
        }

        console.log(`[Export] Order ${orderNumber} all ${order.gangSheets.length} gang sheets completed in ${(totalDuration / 1000).toFixed(1)}s`);
        return lastResult!;
      } else {
        // Geriye uyumluluk: eski tek gangSheetLayout akışı
        const result = await processExport({
          orderId,
          gangSheetLayout: order.gangSheetLayout as unknown as GangSheetLayout,
          gangSheetWidth: order.gangSheetWidth,
          gangSheetHeight: order.gangSheetHeight,
        });

        // Eski alanları güncelle
        await db.order.update({
          where: { id: orderId },
          data: {
            exportPng: result.pngKey,
            exportTiff: result.tiffKey,
            exportPdf: result.pdfKey,
          },
        });

        console.log(`[Export] Order ${orderNumber} (legacy) completed in ${(result.durationMs / 1000).toFixed(1)}s`);
        if (result.skippedItems.length > 0) {
          console.warn(`[Export] Skipped items: ${result.skippedItems.join(", ")}`);
        }

        return result;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    }
  );

  worker.on("ready", () => {
    console.log(`[Export Worker] Started — listening on queue "${EXPORT.QUEUE_NAME}"`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Export Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Export Worker] Error:", err);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[Export Worker] Shutting down...");
    await worker.close();
    await db.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(console.error);
