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

  // ========== Cron Jobs ==========
  const { Queue } = await import("bullmq");
  const cronQueue = new Queue("cron-jobs", { connection: getRedisConnection() });

  // Register repeatable cron jobs
  await cronQueue.add("cleanup-expired-otps", {}, {
    repeat: { pattern: "0 * * * *" }, // every hour
    removeOnComplete: { count: 5 },
    removeOnFail: { count: 10 },
  });
  await cronQueue.add("cleanup-abandoned-orders", {}, {
    repeat: { pattern: "0 3 * * *" }, // daily at 03:00
    removeOnComplete: { count: 5 },
    removeOnFail: { count: 10 },
  });
  await cronQueue.add("cleanup-old-drafts", {}, {
    repeat: { pattern: "0 4 * * *" }, // daily at 04:00
    removeOnComplete: { count: 5 },
    removeOnFail: { count: 10 },
  });

  const cronWorker = new Worker(
    "cron-jobs",
    async (job) => {
      const now = new Date();
      console.log(`[Cron] Running ${job.name} at ${now.toISOString()}`);

      switch (job.name) {
        case "cleanup-expired-otps": {
          // Delete expired verification tokens
          const deletedTokens = await db.verificationToken.deleteMany({
            where: { expires: { lt: now } },
          });
          // Delete expired OTP codes
          const deletedOtps = await db.otpCode.deleteMany({
            where: { expiresAt: { lt: now } },
          });
          console.log(`[Cron] Deleted ${deletedTokens.count} expired verification tokens, ${deletedOtps.count} expired OTP codes`);
          break;
        }

        case "cleanup-abandoned-orders": {
          // Cancel orders stuck in PENDING_PAYMENT for more than 48 hours
          const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          const abandoned = await db.order.findMany({
            where: {
              status: "PENDING_PAYMENT",
              paymentMethod: "BANK_TRANSFER",
              createdAt: { lt: cutoff },
            },
            select: { id: true, orderNumber: true, status: true },
          });

          for (const order of abandoned) {
            await db.$transaction([
              db.order.update({
                where: { id: order.id },
                data: { status: "CANCELLED" },
              }),
              db.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: order.status,
                  toStatus: "CANCELLED",
                  note: "Ödeme süresi doldu (48 saat) — otomatik iptal",
                  eventType: "STATUS_CHANGE",
                },
              }),
            ]);
          }
          console.log(`[Cron] Auto-cancelled ${abandoned.length} abandoned orders`);
          break;
        }

        case "cleanup-old-drafts": {
          // Delete design drafts older than 30 days
          const draftCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const deleted = await db.designDraft.deleteMany({
            where: { updatedAt: { lt: draftCutoff } },
          });
          console.log(`[Cron] Deleted ${deleted.count} old design drafts`);
          break;
        }
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 20 },
    }
  );

  cronWorker.on("ready", () => {
    console.log("[Cron Worker] Started — processing cron jobs");
  });

  cronWorker.on("failed", (job, err) => {
    console.error(`[Cron] Job ${job?.name} failed:`, err.message);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[Export Worker] Shutting down...");
    await Promise.all([worker.close(), cronWorker.close(), cronQueue.close()]);
    await db.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(console.error);
