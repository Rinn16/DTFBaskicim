import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Google OAuth (optional — app works without it)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // S3 / MinIO
  S3_ENDPOINT: z.string().min(1, "S3_ENDPOINT is required"),
  S3_ACCESS_KEY: z.string().min(1, "S3_ACCESS_KEY is required"),
  S3_SECRET_KEY: z.string().min(1, "S3_SECRET_KEY is required"),
  S3_BUCKET: z.string().default("dtf-uploads"),
  S3_REGION: z.string().default("us-east-1"),

  // Redis
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // SMS (required in production)
  SMS_API_KEY: z.string().optional(),
  SMS_API_SECRET: z.string().optional(),
  SMS_SENDER: z.string().optional(),

  // PayTR
  PAYTR_MERCHANT_ID: z.string().optional(),
  PAYTR_MERCHANT_KEY: z.string().optional(),
  PAYTR_MERCHANT_SALT: z.string().optional(),
  PAYTR_TEST_MODE: z.enum(["0", "1"]).default("1"),

  // Bank Transfer
  BANK_ACCOUNT_NAME: z.string().default("DTF Baskicim"),
  BANK_IBAN: z.string().optional(),
  BANK_NAME: z.string().optional(),

  // Email (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("noreply@dtfbaskicim.com"),

  // App
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Production-specific validation
const productionRequiredSchema = envSchema.extend({
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters in production"),
  SMS_API_KEY: z.string().min(1, "SMS_API_KEY is required in production"),
  SMS_API_SECRET: z.string().min(1, "SMS_API_SECRET is required in production"),
  SMS_SENDER: z.string().min(1, "SMS_SENDER is required in production"),
  PAYTR_MERCHANT_ID: z.string().min(1, "PAYTR_MERCHANT_ID is required in production"),
  PAYTR_MERCHANT_KEY: z.string().min(1, "PAYTR_MERCHANT_KEY is required in production"),
  PAYTR_MERCHANT_SALT: z.string().min(1, "PAYTR_MERCHANT_SALT is required in production"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required in production"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required in production"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required in production"),
});

export function validateEnv() {
  const schema = process.env.NODE_ENV === "production" ? productionRequiredSchema : envSchema;

  const result = schema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error("Environment validation failed:\n" + formatted);

    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing required environment variables. See logs above.");
    }
  }

  return result.success ? result.data : undefined;
}

// Validate on module load
validateEnv();
