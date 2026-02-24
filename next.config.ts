import type { NextConfig } from "next";

const s3PublicUrl = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "http://localhost:9000";
const s3PublicHost = new URL(s3PublicUrl).hostname;
const s3PublicProtocol = s3PublicUrl.startsWith("https") ? "https" : "http";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_S3_PUBLIC_URL:
      `${s3PublicUrl}/${process.env.S3_BUCKET || "dtf-uploads"}`,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: s3PublicProtocol as "http" | "https",
        hostname: s3PublicHost,
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paytr.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com " + s3PublicUrl,
              "font-src 'self'",
              "connect-src 'self' " + s3PublicUrl + " https://www.paytr.com",
              "frame-src https://www.paytr.com",
              "worker-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
