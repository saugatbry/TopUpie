"use client";

import Container from "@/components/container";
import Image from "next/image";
import Link from "next/link";
import { proxyCharacterService as characterService } from "@/services/client-proxy";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

export default function CharacterPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState<any>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id as string, 10);
    if (isNaN(numId)) return;

    setLoading(true);
    Promise.all([
      characterService.getById(numId),
      characterService.getVoices(numId).catch(() => ({ data: [] })),
      characterService.getAnime(numId).catch(() => ({ data: [] })),
    ])
      .then(([charRes, voicesRes, animeRes]: any[]) => {
        setCharacter(charRes?.data || charRes || {});
        setVoices(Array.isArray(voicesRes?.data) ? voicesRes.data : Array.isArray(voicesRes) ? voicesRes : []);
        setAnime(Array.isArray(animeRes?.data) ? animeRes.data : Array.isArray(animeRes) ? animeRes : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !character) return <Loading />;

  return (
    <Container className="py-10">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="shrink-0">
          <Image
            src={character.image || ""}
            alt={character.name?.full || character.name || "Character"}
            width={200}
            height={300}
            className="rounded-xl object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">
            {character.name?.full || character.name || "Unknown"}
          </h1>
          {character.name?.native && (
            <p className="text-gray-400 text-lg">{character.name.native}</p>
          )}
          {character.description && (
            <p className="text-gray-300 leading-relaxed">
              {character.description.replace(/<[^>]*>/g, "")}
            </p>
          )}
        </div>
      </div>

      {voices.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Voice Actors</h2>
          <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {voices.map((v: any, idx: number) => (
              <Link
                key={idx}
                href={`/people/${v.id}`}
                className="flex items-center gap-3 rounded-xl bg-secondary p-3 hover:bg-slate-700 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={v.image || ""}
                    alt={v.name?.full || v.name || ""}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {v.name?.full || v.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400">{v.language || ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {anime.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Appears In</h2>
          <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {anime.map((a: any, idx: number) => {
              const animeData = a.anime || a;
              const t = animeData.titles || {};
              return (
                <Link
                  key={idx}
                  href={`/anime/${animeData.slug || animeData.id}`}
                  className="flex flex-col gap-2 rounded-xl bg-secondary p-3 hover:bg-slate-700 transition-colors"
                >
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                    <Image
                      src={animeData.images?.poster || animeData.poster || ""}
                      alt={t.english || t.romaji || animeData.name || "Anime"}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </div>
                  <p className="text-xs font-medium line-clamp-1">
                    {t.english || t.romaji || animeData.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400">{a.role || ""}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </Container>
  );
}
