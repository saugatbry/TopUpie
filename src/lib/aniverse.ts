import { getCached, setCache } from "./cache";

const API_BASE = "https://hindisubanime-api.vercel.app/api";
const CACHE_TIME = 3600;

async function fetchJson(url: string): Promise<any> {
  const cached = await getCached(url, CACHE_TIME);
  if (cached) return cached;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  await setCache(url, data);
  return data;
}

function encodeEpisodeId(animeId: string, season: number, episode: number): string {
  return `${animeId}-s${season}-ep${episode}`;
}

function parseEpisodeId(episodeId: string): { animeId: string; season: number; episode: number } | null {
  const match = /^(.+)-s(\d+)-ep(\d+)$/.exec(episodeId);
  if (match) {
    return { animeId: match[1], season: parseInt(match[2]), episode: parseInt(match[3]) };
  }
  return null;
}

export const aniverse = {
  async getHomePage() {
    try {
      const [homeData, newAdded, seriesData] = await Promise.all([
        fetchJson(`${API_BASE}`).catch(() => ({ results: {} })),
        fetchJson(`${API_BASE}/newadded`).catch(() => ({ results: [] })),
        fetchJson(`${API_BASE}/series?page=1`).catch(() => ({ results: { results: [] } })),
      ]);

      const categories = homeData?.results || {};
      const categoryResults: any[] = [];
      for (const key of Object.keys(categories)) {
        if (Array.isArray(categories[key])) {
          categoryResults.push(...categories[key]);
        }
      }

      const newResults = newAdded?.results || [];
      const seriesResults = seriesData?.results?.results || [];

      const allResults = categoryResults.length > 0
        ? categoryResults
        : seriesResults.length > 0
          ? seriesResults
          : newResults;

      const seen = new Set<string>();
      const uniqueResults = allResults.filter((r: any) => {
        if (!r.anime_id || seen.has(r.anime_id)) return false;
        seen.add(r.anime_id);
        return true;
      });

      const mapResult = (item: any, rank: number) => ({
        id: item.anime_id || "",
        name: item.title || "Unknown",
        jname: "",
        poster: item.poster || "",
        episodes: { sub: null, dub: null },
        type: "TV" as const,
        rank,
      });

      const mappedResults = uniqueResults.map((r: any, i: number) => mapResult(r, i + 1));

      const spotlightAnimes = mappedResults.slice(0, 5).map((a: any) => ({
        ...a,
        description: "",
        otherInfo: [],
      }));

      return {
        spotlightAnimes,
        trendingAnimes: mappedResults.slice(0, 15),
        latestEpisodeAnimes: mappedResults.slice(0, 20),
        topUpcomingAnimes: mappedResults.slice(0, 10),
        top10Animes: {
          today: mappedResults.slice(0, 10),
          week: mappedResults.slice(0, 10),
          month: mappedResults.slice(0, 10),
        },
        topAiringAnimes: mappedResults.slice(0, 15),
        mostPopularAnimes: mappedResults.slice(0, 15),
        mostFavoriteAnimes: mappedResults.slice(0, 15).sort((a: any, b: any) => (b.rank || 0) - (a.rank || 0)),
        latestCompletedAnimes: mappedResults.slice(15, 30),
        genres: [],
      };
    } catch (error) {
      console.error("Error fetching home page:", error);
      return {
        spotlightAnimes: [], trendingAnimes: [], latestEpisodeAnimes: [],
        topUpcomingAnimes: [], top10Animes: { today: [], week: [], month: [] },
        topAiringAnimes: [], mostPopularAnimes: [], mostFavoriteAnimes: [],
        latestCompletedAnimes: [], genres: [],
      };
    }
  },

  async getInfo(id: string) {
    try {
      const data = await fetchJson(`${API_BASE}/info?id=${encodeURIComponent(id)}`);
      const a = data?.data || data;
      if (!a || !a.title) throw new Error("Anime not found");

      const poster = a.poster || "";
      const genres = Array.isArray(a.genres) ? a.genres : [];
      const totalSeasons = a.totalSeasons || parseInt(a.seasons) || 1;
      const totalEpisodes = parseInt(a.episodes) || 0;

      return {
        anime: {
          info: {
            id,
            anilistId: 0,
            malId: 0,
            name: a.title || "Unknown",
            poster,
            description: a.overview || "",
            stats: {
              rating: a.rating || "",
              quality: a.quality || "HD",
              episodes: { sub: totalEpisodes, dub: 0 },
              type: "TV",
              duration: a.runningTime || "",
            },
            promotionalVideos: [],
            charactersVoiceActors: [],
          },
          moreInfo: {
            japanese: "",
            synonyms: "",
            aired: a.year || "",
            premiered: a.year || "",
            duration: a.runningTime || "",
            status: "Unknown",
            malscore: a.rating || "",
            genres,
            studios: "",
            producers: [],
          },
        },
        seasons: Array.from({ length: totalSeasons }, (_, i) => ({
          id: `${id}-season-${i + 1}`,
          name: `Season ${i + 1}`,
          title: `Season ${i + 1}`,
          poster: "",
          isCurrent: i === 0,
        })),
        mostPopularAnimes: [],
        relatedAnimes: [],
        recommendedAnimes: [],
      };
    } catch (error) {
      console.error("Error fetching anime info:", error);
      throw error;
    }
  },

  async search(query: string, page: number = 1) {
    try {
      const data = await fetchJson(`${API_BASE}/search?s=${encodeURIComponent(query)}&page=${page}`);
      const results = data?.results;
      const items = results?.results || [];

      const animes = items.map((item: any) => ({
        id: item.anime_id || "",
        name: item.title || "Unknown",
        jname: "",
        poster: item.poster || "",
        episodes: { sub: null, dub: null },
        type: "TV" as const,
        rank: null as number | null,
      }));

      return {
        animes,
        totalPages: results?.totalPages || 1,
        currentPage: results?.currentPage || page,
        hasNextPage: (results?.currentPage || page) < (results?.totalPages || 1),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      console.error("Error searching anime:", error);
      return { animes: [], totalPages: 1, currentPage: page, hasNextPage: false, hasPrevPage: false };
    }
  },

  async getEpisodes(id: string) {
    try {
      const info = await this.getInfo(id);
      const totalSeasons = info.seasons.length;

      const allEpisodes: any[] = [];
      let totalEp = 0;

      for (let s = 1; s <= totalSeasons; s++) {
        try {
          const epData = await fetchJson(`${API_BASE}/episodes?id=${encodeURIComponent(id)}&season=${s}`);
          const epResults = epData?.results;
          if (epResults?.episodes) {
            totalEp += epResults.totalEpisodes || epResults.episodes.length;
            for (const ep of epResults.episodes) {
              allEpisodes.push({
                number: allEpisodes.length + 1,
                episodeId: encodeEpisodeId(id, s, parseInt(ep.episode)),
                title: ep.title || `Episode ${ep.episode}`,
                isFiller: false,
              });
            }
          }
        } catch {
          continue;
        }
      }

      if (allEpisodes.length === 0) {
        try {
          const epData = await fetchJson(`${API_BASE}/episodes?id=${encodeURIComponent(id)}&season=1`);
          const epResults = epData?.results;
          if (epResults?.episodes) {
            for (const ep of epResults.episodes) {
              allEpisodes.push({
                number: parseInt(ep.episode),
                episodeId: encodeEpisodeId(id, 1, parseInt(ep.episode)),
                title: ep.title || `Episode ${ep.episode}`,
                isFiller: false,
              });
            }
            totalEp = epResults.totalEpisodes || allEpisodes.length;
          }
        } catch {
          return { totalEpisodes: 0, episodes: [] };
        }
      }

      return { totalEpisodes: totalEp || allEpisodes.length, episodes: allEpisodes };
    } catch (error) {
      console.error("Error fetching episodes:", error);
      return { totalEpisodes: 0, episodes: [] };
    }
  },

  async getEpisodeServers(episodeId: string) {
    const parsed = parseEpisodeId(episodeId);
    if (!parsed) {
      const genericMatch = /^(.+)-(\d+)$/.exec(episodeId);
      if (genericMatch) {
        return {
          episodeId,
          episodeNo: genericMatch[2],
          sub: [{ serverId: 1, serverName: "Server 1" }],
          dub: [],
          raw: [],
        };
      }
      return { episodeId, episodeNo: "1", sub: [], dub: [], raw: [] };
    }

    try {
      const data = await fetchJson(`${API_BASE}/stream?id=${encodeURIComponent(parsed.animeId)}&season=${parsed.season}&ep=${parsed.episode}`);
      const servers = data?.results || [];

      const sub = servers.map((s: any, i: number) => ({
        serverId: i + 1,
        serverName: s.server || `Server ${i + 1}`,
      }));

      return {
        episodeId,
        episodeNo: String(parsed.episode),
        sub,
        dub: [],
        raw: [],
      };
    } catch {
      return {
        episodeId,
        episodeNo: String(parsed.episode),
        sub: [{ serverId: 1, serverName: "Default" }],
        dub: [],
        raw: [],
      };
    }
  },

  async getEpisodeSources(episodeId: string, serverId?: number) {
    const parsed = parseEpisodeId(episodeId);
    if (!parsed) {
      return {
        headers: { Referer: "" },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [{ url: "", type: "hls" }],
        anilistID: 0,
        malID: 0,
      };
    }

    try {
      const data = await fetchJson(`${API_BASE}/stream?id=${encodeURIComponent(parsed.animeId)}&season=${parsed.season}&ep=${parsed.episode}`);
      const servers = data?.results || [];
      const idx = serverId ? serverId - 1 : 0;
      const selected = servers[idx] || servers[0];

      return {
        headers: { Referer: "" },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [{ url: selected?.embed || "", type: "iframe" }],
        anilistID: 0,
        malID: 0,
      };
    } catch {
      return {
        headers: { Referer: "" },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [{ url: "", type: "hls" }],
        anilistID: 0,
        malID: 0,
      };
    }
  },

  async searchSuggestions(query: string) {
    try {
      const data = await fetchJson(`${API_BASE}/search?s=${encodeURIComponent(query)}&page=1`);
      const items = data?.results?.results || [];
      return items.slice(0, 8).map((item: any) => ({
        id: item.anime_id || "",
        name: item.title || "Unknown",
        jname: "",
        poster: item.poster || "",
        type: "TV",
        rank: null,
        episodes: { sub: null, dub: null },
        moreInfo: [],
      }));
    } catch {
      return [];
    }
  },

  async getEstimatedSchedule() {
    try {
      const data = await fetchJson(`${API_BASE}/newadded`);
      const items = data?.results || [];
      return items.slice(0, 20).map((item: any) => ({
        id: item.anime_id || "",
        name: item.title || "Unknown",
        jname: "",
        poster: item.poster || "",
        airingTimestamp: Date.now(),
        secondsUntilAiring: 0,
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        episode: parseInt(item.episode) || 0,
      }));
    } catch {
      return [];
    }
  },
};

export { encodeEpisodeId, parseEpisodeId };
