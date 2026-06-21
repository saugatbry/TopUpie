"use client";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { proxySeriesService as seriesService } from "@/services/client-proxy";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

export default function SeriesPage() {
  const { slug } = useParams();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (seriesService.getSeriesBySlug(slug as string) as Promise<any>)
      .then((res) => {
        setSeries(res?.data || res || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (!series) {
    return (
      <Container className="py-10">
        <p className="text-gray-500">Series not found.</p>
      </Container>
    );
  }

  const entries = Array.isArray(series?.entries) ? series.entries : Array.isArray(series?.anime) ? series.anime : Array.isArray(series) ? series : [];

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-2">{series.title || series.name || slug}</h1>
      {series.description && (
        <p className="text-gray-400 mb-8">{series.description}</p>
      )}
      {entries.length === 0 ? (
        <p className="text-gray-500">No entries found in this series.</p>
      ) : (
        <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5">
          {entries.map((item: any, idx: number) => {
            const animeData = item.anime || item;
            const t = animeData.titles || {};
            return (
              <AnimeCard
                key={idx}
                title={t.english || t.romaji || animeData.name || "Unknown"}
                poster={animeData.images?.poster || animeData.poster || ""}
                subTitle={item.relation || animeData.type || ""}
                href={`${ROUTES.ANIME_DETAILS}/${animeData.slug || animeData.id}`}
                sub={animeData.sub ?? animeData.sub_count ?? null}
                dub={animeData.dub ?? animeData.dub_count ?? null}
                className="self-center justify-self-center"
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}
