"use client";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { proxyHomeService as homeService } from "@/services/client-proxy";
import { useEffect, useState } from "react";
import { AnimeCardGridSkeleton } from "@/components/anime-card-skeleton";

export default function TrendingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeService.getTrending().then((res) => {
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setItems(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-8">Trending Anime</h1>
      {loading ? (
        <AnimeCardGridSkeleton count={14} />
      ) : items.length === 0 ? (
        <p className="text-gray-500">No trending anime available.</p>
      ) : (
        <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5">
          {items.map((item: any, idx: number) => (
            <AnimeCard
              key={idx}
              title={item.title || item.name || "Unknown"}
              poster={item.poster || ""}
              subTitle={item.type || ""}
              href={`${ROUTES.ANIME_DETAILS}/${item.slug?.split("/")[0] || item.slug || item.id}`}
              sub={item.sub ?? null}
              dub={item.dub ?? null}
              className="self-center justify-self-center"
            />
          ))}
        </div>
      )}
    </Container>
  );
}
