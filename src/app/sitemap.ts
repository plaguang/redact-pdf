import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://redact-pdf-phi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/black-out-text-in-pdf", "/remove-personal-information-from-pdf"].map((p, i) => ({
    url: `${SITE}${p}`,
    changeFrequency: "monthly" as const,
    priority: i === 0 ? 1 : 0.8,
  }));
}
