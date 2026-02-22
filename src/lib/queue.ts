import { Queue } from "bullmq";
import { EXPORT } from "./constants";

function getRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  };
}

const globalForQueue = globalThis as unknown as {
  exportQueue: Queue | undefined;
};

export const exportQueue =
  globalForQueue.exportQueue ??
  new Queue(EXPORT.QUEUE_NAME, { connection: getRedisConnection() });

if (process.env.NODE_ENV !== "production") globalForQueue.exportQueue = exportQueue;
