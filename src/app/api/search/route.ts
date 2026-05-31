import { hianime } from "@/lib/hianime";
import { aniverse } from "@/lib/aniverse";
import { SearchAnimeParams } from "@/types/anime";

const JIKAN_API = "https://api.jikan.moe/v4";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseSearchParams(searchParams);

    const [hindiResults, jikanRaw] = await Promise.all([
      aniverse.search(params.q, params.page).catch(() => ({ animes: [], totalPages: 1, hasNextPage: false, currentPage: 1 })),
      fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(params.q)}&page=${params.page}&limit=20`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      }).then((r) => r.json()).catch(() => ({ data: [], pagination: { last_visible_page: 1, has_next_page: false } })),
    ]);

    const jikanAnimes = (jikanRaw.data || []).map((item: any) => ({
      id: String(item.mal_id),
      name: item.title_english || item.title || "Unknown",
      jname: item.title_japanese || "",
      poster: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
      episodes: { sub: item.episodes || null, dub: null },
      type: item.type || "TV",
      rank: item.rank || null,
      provider: "subdub" as const,
    }));

    const hindiAnimes = (hindiResults?.animes || []).map((a: any) => ({
      ...a,
      provider: "hindi" as const,
    }));

    const merged = [...jikanAnimes, ...hindiAnimes];

    return Response.json({
      data: {
        animes: merged,
        totalPages: Math.max(jikanRaw.pagination?.last_visible_page || 1, hindiResults?.totalPages || 1),
        hasNextPage: jikanRaw.pagination?.has_next_page || hindiResults?.hasNextPage || false,
        currentPage: params.page,
      },
    });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}

const parseSearchParams = (
  searchParams: URLSearchParams,
): SearchAnimeParams => {
  const getString = (key: string) => {
    const val = searchParams.get(key);
    return val === null ? undefined : val;
  };

  const getNumber = (key: string) => {
    const val = searchParams.get(key);
    const num = val ? parseInt(val, 10) : undefined;
    return num === undefined || isNaN(num) ? undefined : num;
  };

  return {
    q: getString("q") || "",
    page: getNumber("page") || 1,
    type: getString("type"),
    status: getString("status"),
    rated: getString("rated"),
    season: getString("season"),
    language: getString("language"),
    sort: getString("sort"),
    genres: getString("genres"),
  };
};
