import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://topupie.vercel.app";

async function fetchTopAnimeIds(): Promise<number[]> {
  try {
    const res = await fetch(
      "https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25&page=1",
    );
    const data = await res.json();
    return (data.data ?? []).map((a: any) => a.mal_id).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const topIds = await fetchTopAnimeIds();
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

  const animePages = topIds.map((id) => ({
    url: `${baseUrl}/anime/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...animePages];
}
