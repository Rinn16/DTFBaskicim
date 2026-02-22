import { redis } from "@/lib/redis";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === "development") {
    return { success: true, remaining: limit, limit };
  }

  const redisKey = `rate-limit:${key}`;

  const current = await redis.incr(redisKey);

  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
    limit,
  };
}
