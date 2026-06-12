import { MetadataRoute } from "next";
import { COUNSEL_AREAS, MATTERS } from "@/lib/constants";

const siteUrl = "https://www.jamesroman.la";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/nda`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const counselPages: MetadataRoute.Sitemap = COUNSEL_AREAS.map((area) => ({
    url: `${siteUrl}/counsel/${area.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const matterPages: MetadataRoute.Sitemap = MATTERS.map((matter) => ({
    url: `${siteUrl}/engagements/${matter.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...counselPages, ...matterPages];
}
