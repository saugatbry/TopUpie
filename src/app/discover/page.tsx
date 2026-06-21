"use client";

import Container from "@/components/container";
import { ROUTES } from "@/constants/routes";
import { proxyMetadataService as metadataService, proxyHomeService as homeService } from "@/services/client-proxy";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metadataService.getGenres()
      .then((res) => {
        setGenres(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRandom = async () => {
    try {
      const res = await homeService.getRandom();
      const anime = res?.data || res || {};
      const slug = anime.slug || anime.id;
      if (slug) router.push(`${ROUTES.ANIME_DETAILS}/${slug}`);
    } catch {
      // silent
    }
  };

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-2">Discover Anime</h1>
      <p className="text-gray-400 mb-8">
        Browse anime by genre, studio, or try your luck with a random pick.
      </p>

      <div className="mb-10">
        <button
          onClick={handleRandom}
          className="px-6 py-3 bg-[#e9376b] text-white rounded-lg font-medium hover:bg-[#d62d5d] transition-colors"
        >
          Random Anime
        </button>
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Browse by Genre</h2>
        {loading ? (
          <div className="h-20 bg-secondary rounded-xl animate-pulse" />
        ) : genres.length === 0 ? (
          <p className="text-gray-500">No genres available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {genres.map((genre: string, idx: number) => (
              <a
                key={idx}
                href={`/anime/genre/${encodeURIComponent(genre)}`}
                className="px-3 py-1.5 rounded-md bg-secondary text-sm text-gray-300 hover:bg-slate-700 transition-colors"
              >
                {genre}
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">A-Z Listing</h2>
        <div className="flex flex-wrap gap-2">
          {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => (
            <a
              key={letter}
              href={`/anime/az-list/${letter}`}
              className="w-9 h-9 flex items-center justify-center rounded-md bg-secondary text-sm font-medium text-gray-300 hover:bg-slate-700 transition-colors"
            >
              {letter.toUpperCase()}
            </a>
          ))}
        </div>
      </section>
    </Container>
  );
}
