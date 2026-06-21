import { animeService, searchService, homeService, scheduleService } from "@/services/aniforge";
import type { IAnimeData, IAnimeSearch, ISuggestionAnime, Top10Animes, TopUpcomingAnime } from "@/types/anime";
import type { IAnimeDetails } from "@/types/anime-details";
import type { IEpisodes } from "@/types/episodes";

function unwrap<T>(res: any): T {
  return (res?.results ?? res) as T;
}

function cleanSlug(slug: string): string {
  return slug?.split("/")[0] || slug || "";
}

function mapAnimeItem(item: any) {
  const slug = cleanSlug(item.slug);
  return {
    id: slug || item.id?.toString() || "",
    name: item.title || item.name || "Unknown",
    jname: item.japaneseTitle || "",
    poster: item.poster || item.images?.poster || "",
    episodes: { sub: item.sub ?? null, dub: item.dub ?? null },
    type: typeof item.type === "string" ? item.type : item.type?.name || "TV",
    rank: item.rank ?? (item.rating ? parseFloat(item.rating) : null),
  };
}

function mapSpotlight(item: any) {
  return {
    rank: item.rank ?? 0,
    id: cleanSlug(item.slug) || item.id?.toString() || "",
    name: item.title || "Unknown",
    description: item.description || "",
    poster: item.poster || "",
    banner: item.backgroundImage || item.banner || "",
    jname: item.japaneseTitle || "",
    episodes: { sub: item.sub ?? null, dub: item.dub ?? null },
    type: typeof item.type === "string" ? item.type : item.type?.name || "TV",
    otherInfo: [item.rating || "", item.quality || "", item.date || ""].filter(Boolean),
  };
}

async function getHomeData(): Promise<IAnimeData> {
  try {
    const [homeRes, popularRes, favRes, newlyRes, newReleaseRes, movieRes, top10Res] = await Promise.all([
      homeService.getHome(),
      homeService.getMostPopular(1).catch(() => ({ results: { data: [] } })),
      homeService.getMostPopular(2).catch(() => ({ results: { data: [] } })),
      homeService.getRecentlyAdded(1).catch(() => ({ results: { data: [] } })),
      homeService.getRecentlyUpdated(1).catch(() => ({ results: { data: [] } })),
      homeService.getMovies().catch(() => ({ results: { data: [] } })),
      homeService.getTop10().catch(() => ({ results: { today: [], week: [], month: [] } })),
    ]);

    const d = unwrap<any>(homeRes);
    const sections = d || {};
    const top10Raw = unwrap<any>(top10Res);

    const spotlight = (sections.spotlights || sections.spotlight || []).map(mapSpotlight);
    const trending = (sections.trending || []).map(mapAnimeItem);
    const top10: Top10Animes = {
      today: (top10Raw.today || []).map(mapAnimeItem),
      week: (top10Raw.week || []).map(mapAnimeItem),
      month: (top10Raw.month || []).map(mapAnimeItem),
    };

    function extractData(res: any) {
      const u = unwrap<any>(res);
      const arr = u?.data || u;
      return Array.isArray(arr) ? arr.map(mapAnimeItem) : [];
    }

    return {
      spotlightAnimes: spotlight,
      trendingAnimes: trending,
      latestEpisodeAnimes: extractData(newlyRes).slice(0, 10),
      topUpcomingAnimes: [] as TopUpcomingAnime[],
      top10Animes: top10,
      topAiringAnimes: (sections.topAiring || []).map(mapAnimeItem),
      mostPopularAnimes: extractData(popularRes),
      mostFavoriteAnimes: extractData(favRes),
      latestCompletedAnimes: extractData(newReleaseRes),
      genres: sections.genres || [],
      trendingNow: trending,
      topAiring: (sections.topAiring || []).map(mapAnimeItem),
      popularThisWeek: extractData(popularRes),
      mostFavorite: extractData(popularRes),
      topMovies: extractData(movieRes),
    } as IAnimeData & Record<string, any>;
  } catch (e) {
    console.error("getHomeData error:", e);
    throw e;
  }
}

async function getInfo(idOrSlug: string): Promise<IAnimeDetails> {
  const res = await animeService.getById(idOrSlug);
  const a = unwrap<any>(res);
  if (!a || !a.title) throw new Error("Anime not found");

  const poster = a.poster || "";
  const banner = a.backgroundImage || "";
  const genres = Array.isArray(a.genres) ? a.genres : [];

  return {
    anime: {
      info: {
        id: idOrSlug,
        anilistId: a.animeId || 0,
        malId: parseInt(a.malScore) || 0,
        name: a.title || "Unknown",
        poster, banner,
        description: a.synopsis || "",
        stats: {
          rating: a.malScore || "",
          quality: "HD",
          episodes: { sub: 0, dub: 0 },
          type: typeof a.type === "string" ? a.type : a.type?.name || "TV",
          duration: a.duration || "",
        },
        promotionalVideos: [],
        charactersVoiceActors: [],
      },
      moreInfo: {
        japanese: a.japaneseTitle || "",
        synonyms: a.altNames || "",
        aired: a.aired || "",
        premiered: a.premiered || "",
        duration: a.duration || "",
        status: typeof a.status === "string" ? a.status : a.status?.name || "Unknown",
        malscore: a.malScore || "",
        genres: genres.map((g: any) => typeof g === "string" ? g : g.name || "").filter(Boolean),
        studios: Array.isArray(a.studios) ? a.studios.join(", ") : (typeof a.studios === "string" ? a.studios : ""),
        producers: Array.isArray(a.producers) ? a.producers.map((p: any) => typeof p === "string" ? p : p.name || "").filter(Boolean) : (typeof a.producers === "string" ? [a.producers] : []),
      },
    },
    seasons: [{ id: idOrSlug, name: a.title || "Unknown", title: a.title || "Unknown", poster, isCurrent: true }],
    mostPopularAnimes: [],
    relatedAnimes: [],
    recommendedAnimes: [],
  };
}

async function searchAnime(query: string, page = 1): Promise<IAnimeSearch> {
  try {
    const res = await searchService.search(query, page);
    const data = unwrap<any>(res);
    const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    const pages = data?.totalPages || 1;
    return {
      animes: items.map(mapAnimeItem),
      totalPages: pages,
      currentPage: page,
      hasNextPage: page < pages,
    };
  } catch {
    return { animes: [], totalPages: 1, currentPage: page, hasNextPage: false };
  }
}

async function searchSuggestions(query: string): Promise<ISuggestionAnime[]> {
  try {
    const res = await searchService.suggestion(query);
    const items = unwrap<any[]>(res);
    return (items || []).slice(0, 12).map((item: any) => ({
      id: cleanSlug(item.slug) || item.id?.toString() || "",
      name: item.title || item.name || "Unknown",
      jname: item.japaneseTitle || "",
      poster: item.poster || "",
      episodes: { sub: item.sub ?? null, dub: null },
      type: typeof item.type === "string" ? item.type : "",
        rank: undefined,
        moreInfo: [typeof item.type === "string" ? item.type : "", item.quality || "", ""].filter(Boolean),
    }));
  } catch {
    return [];
  }
}

async function getEpisodes(idOrSlug: string): Promise<IEpisodes> {
  try {
    const [detailRes, epRes] = await Promise.all([
      animeService.getById(idOrSlug).catch(() => ({ results: {} })),
      animeService.getEpisodes(idOrSlug),
    ]);
    const detail = unwrap<any>(detailRes);
    const epData = unwrap<any>(epRes);
    const rawEpisodes = epData?.episodes || (Array.isArray(epData) ? epData : []);
    const episodes = Array.isArray(rawEpisodes) ? rawEpisodes : [];
    return {
      totalEpisodes: epData?.totalEpisodes || episodes.length,
      episodes: episodes.map((ep: any) => ({
        number: ep.episode_no || 0,
        episodeId: ep.episode_no?.toString() || "0",
        title: ep.title || `Episode ${ep.episode_no}`,
        isFiller: false,
        ani: "",
        mal: "",
        embed_id: ep.server_ids || "",
        thumbnail: "",
      })),
      subCount: 0,
      dubCount: 0,
      anilistId: detail.animeId || 0,
      malId: 0,
    };
  } catch {
    return { totalEpisodes: 0, episodes: [], subCount: 0, dubCount: 0, anilistId: 0, malId: 0 };
  }
}

export const hianime = {
  getHomePage: getHomeData,
  getInfo,
  search: searchAnime,
  searchSuggestions,
  getEpisodes,
  getEstimatedSchedule: (date?: string) => scheduleService.getSchedules(date),
};
