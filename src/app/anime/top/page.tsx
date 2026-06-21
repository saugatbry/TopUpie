"use client";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { proxyHomeService as homeService } from "@/services/client-proxy";
import { useEffect, useState } from "react";
import { AnimeCardGridSkeleton } from "@/components/anime-card-skeleton";

export default function TopPage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    homeService.getTop(page).then((res) => {
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setItems(data);
      setTotalPages(res?.pages || res?.totalPages || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-8">Top Anime</h1>
      {loading ? (
        <AnimeCardGridSkeleton count={14} />
      ) : items.length === 0 ? (
        <p className="text-gray-500">No anime found.</p>
      ) : (
        <>
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
          <div className="flex justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-md bg-secondary text-gray-300 disabled:opacity-30 hover:bg-slate-700"
            >
              Prev
            </button>
            <span className="flex items-center text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-md bg-secondary text-gray-300 disabled:opacity-30 hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </>
      )}
    </Container>
  );
}
