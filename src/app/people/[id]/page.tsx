"use client";

import Container from "@/components/container";
import Image from "next/image";
import Link from "next/link";
import { proxyPeopleService as peopleService } from "@/services/client-proxy";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

export default function PersonPage() {
  const { id } = useParams();
  const [person, setPerson] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id as string, 10);
    if (isNaN(numId)) return;

    setLoading(true);
    Promise.all([
      peopleService.getById(numId),
      peopleService.getRoles(numId).catch(() => ({ data: [] })),
      peopleService.getCharacters(numId).catch(() => ({ data: [] })),
    ])
      .then(([personRes, rolesRes, charsRes]: any[]) => {
        setPerson(personRes?.data || personRes || {});
        setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : Array.isArray(rolesRes) ? rolesRes : []);
        setCharacters(Array.isArray(charsRes?.data) ? charsRes.data : Array.isArray(charsRes) ? charsRes : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !person) return <Loading />;

  return (
    <Container className="py-10">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="shrink-0">
          <Image
            src={person.image || ""}
            alt={person.name?.full || person.name || "Person"}
            width={200}
            height={300}
            className="rounded-xl object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">
            {person.name?.full || person.name || "Unknown"}
          </h1>
          {person.name?.native && (
            <p className="text-gray-400 text-lg">{person.name.native}</p>
          )}
          {person.primaryOccupations && (
            <p className="text-gray-400">
              {person.primaryOccupations.join(", ")}
            </p>
          )}
          {person.description && (
            <p className="text-gray-300 leading-relaxed">
              {person.description.replace(/<[^>]*>/g, "")}
            </p>
          )}
        </div>
      </div>

      {roles.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Voice Acting Roles</h2>
          <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {roles.map((r: any, idx: number) => {
              const animeData = r.anime || r;
              const ct = r.character || {};
              const t = animeData.titles || {};
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-xl bg-secondary p-3"
                >
                  <Link
                    href={`/anime/${animeData.slug || animeData.id}`}
                    className="relative w-full aspect-[3/4] rounded-lg overflow-hidden"
                  >
                    <Image
                      src={animeData.images?.poster || animeData.poster || ""}
                      alt={t.english || t.romaji || animeData.name || "Anime"}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </Link>
                  <p className="text-xs font-medium line-clamp-1">
                    {t.english || t.romaji || animeData.name || "Unknown"}
                  </p>
                  {ct.name?.full && (
                    <p className="text-xs text-gray-400">
                      as {ct.name.full}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {characters.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Characters</h2>
          <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {characters.map((c: any, idx: number) => (
              <Link
                key={idx}
                href={`/characters/${c.id}`}
                className="flex flex-col items-center gap-2 rounded-xl bg-secondary p-4 hover:bg-slate-700 transition-colors"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden">
                  <Image
                    src={c.image || ""}
                    alt={c.name?.full || c.name || "Character"}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <p className="text-sm font-medium text-center line-clamp-1">
                  {c.name?.full || c.name || "Unknown"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
