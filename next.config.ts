import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_S3_PUBLIC_URL:
      `${process.env.S3_ENDPOINT || "http://localhost:9000"}/${process.env.S3_BUCKET || "dtf-uploads"}`,
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
        protocol: process.env.S3_ENDPOINT?.startsWith("https") ? "https" : "http",
        hostname: new URL(process.env.S3_ENDPOINT || "http://localhost:9000").hostname,
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
              "img-src 'self' data: blob: https://lh3.googleusercontent.com " +
                (process.env.S3_ENDPOINT || "http://localhost:9000"),
              "font-src 'self'",
              "connect-src 'self' " +
                (process.env.S3_ENDPOINT || "http://localhost:9000") +
                " https://www.paytr.com",
              "frame-src https://www.paytr.com",
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
