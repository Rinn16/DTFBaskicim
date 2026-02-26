import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { s3Client, S3_BUCKET } from "@/lib/s3";
import { HeadBucketCommand } from "@aws-sdk/client-s3";

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number }> = {};
  let allOk = true;

  // DB check
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.db = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    console.error("[health] DB check failed:", err);
    checks.db = { ok: false };
    allOk = false;
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { ok: true, latencyMs: Date.now() - redisStart };
  } catch (err) {
    console.error("[health] Redis check failed:", err);
    checks.redis = { ok: false };
    allOk = false;
  }

  // S3 check
  const s3Start = Date.now();
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    checks.s3 = { ok: true, latencyMs: Date.now() - s3Start };
  } catch (err) {
    console.error("[health] S3 check failed:", err);
    checks.s3 = { ok: false };
    allOk = false;
  }

  return NextResponse.json(
    { ok: allOk, checks },
    { status: allOk ? 200 : 503 }
  );
}
