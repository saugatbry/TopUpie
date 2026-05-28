import type { MetadataRoute } from "next";

const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://topupie.vercel.app";
const baseUrl = raw.replace(/\/+$/, "");

const POPULAR_MAL_IDS = [
  21, 16498, 15335, 30276, 5114, 28977, 9253, 1, 269, 22319,
  13601, 199, 11061, 1735, 14719, 11757, 38524, 41467, 24701,
  20920, 28851, 24833, 31758, 34881, 9969, 28755, 20, 23273,
  1575, 39468, 36098, 46102, 36456, 35120, 2251, 4565, 20507,
  6594, 34134, 15, 2001, 8129, 4548, 33314, 34934, 35849,
  31478, 10719, 37029, 392, 35760, 52701, 37510, 50620,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
  ];

  const animePages = POPULAR_MAL_IDS.map((id) => ({
    url: `${baseUrl}/anime/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...animePages];
}
