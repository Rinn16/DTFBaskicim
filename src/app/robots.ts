import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dtfbaskicim.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/hesabim/", "/odeme/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
