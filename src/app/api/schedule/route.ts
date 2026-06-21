const ANIME_API = "https://anikototvapi.vercel.app/api";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hashDay(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 7;
}

export async function GET() {
  try {
    const firstRes = await fetch(`${ANIME_API}/status/currently-airing?page=1`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!firstRes.ok) return Response.json([], { status: 200 });
    const firstData = await firstRes.json();
    const totalPages: number = firstData?.results?.totalPages || 0;
    const allAnime: any[] = [...(firstData?.results?.data || [])];

    if (totalPages > 1) {
      const pages = [];
      for (let p = 2; p <= totalPages; p++) {
        pages.push(
          fetch(`${ANIME_API}/status/currently-airing?page=${p}`, {
            signal: AbortSignal.timeout(15000),
          }).then((r) => (r.ok ? r.json() : { results: { data: [] } })),
        );
      }
      const results = await Promise.all(pages);
      for (const r of results) {
        if (r?.results?.data) allAnime.push(...r.results.data);
      }
    }

    const items = allAnime.map((anime) => {
      const cleanSlug = anime.slug?.split("/")[0] || anime.slug || String(anime.animeId || "");
      const dayIndex = hashDay(cleanSlug);
      return {
        airingDay: DAYS[dayIndex],
        title: anime.title || anime.japaneseTitle || "Unknown",
        jname: anime.japaneseTitle || "",
        time: "",
        episode: anime.sub || 0,
        episodeNumber: anime.sub || 0,
        type: anime.type || "",
        slug: cleanSlug,
        id: anime.animeId,
        poster: anime.poster,
      };
    });

    return Response.json(items);
  } catch {
    return Response.json([], { status: 200 });
  }
}
