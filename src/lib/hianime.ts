import { getCached, setCache } from "./cache";
import { refreshProxies, getNextProxy } from "./proxy";
import { getPreSeededEpisodeCount } from "@/data/episode-counts";
import { getAnilistEpisodeCount, getAnilistBanners } from "./anilist";


// Using Jikan API v4 - a reliable and well-maintained anime API
const JIKAN_API = "https://api.jikan.moe/v4";
const CACHE_TIME = 3600; // 1 hour cache
const RATE_LIMIT_DELAY = 450; // ms between requests (Jikan allows ~3/sec)
let lastRequestTime = 0;
let requestCount = 0;
let windowStart = Date.now();
let proxyFetchEnabled = false;

// Global in-memory cache for episode counts — persists across requests
// within the same serverless function warm instance
const episodeCountCache = new Map<string, number>();

async function doFetch(url: string, _useProxy = false, _proxyUrl?: string | null): Promise<Response> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };
  return fetch(url, { headers, signal: AbortSignal.timeout(15000) });
}

async function rateLimitedFetch(url: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const now = Date.now();
    if (now - windowStart > 1000) {
      requestCount = 0;
      windowStart = now;
    }
    if (requestCount >= 3) {
      const wait = 1000 - (now - windowStart);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      requestCount = 0;
      windowStart = Date.now();
    }
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();
    requestCount++;

    try {
      const useProxy = proxyFetchEnabled || (attempt >= retries - 1);
      const proxyUrl = useProxy ? getNextProxy() : null;
      const response = await doFetch(url, !!proxyUrl, proxyUrl);

      if (response.status === 429) {
        if (!proxyFetchEnabled) {
          proxyFetchEnabled = true;
          refreshProxies().catch(() => {});
        }
        const retryAfter = parseInt(response.headers.get("Retry-After") || "2", 10);
        const waitMs = Math.min(retryAfter * 1000, 5000);
        console.warn(`Rate limited (429), ${proxyUrl ? "using proxy" : ""} retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (attempt < retries) {
        if (error.message === "API error: 429") continue;
        continue;
      }
      throw error;
    }
  }
}

async function fetchAllWithConcurrency(urls: string[], concurrency = 3): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const cached = await getCached(url, CACHE_TIME);
        if (cached) return cached;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const useProxy = proxyFetchEnabled || (attempt >= 2);
            const proxyUrl = useProxy ? getNextProxy() : null;
            const resp = await doFetch(url, !!proxyUrl, proxyUrl);
            if (!resp.ok) {
              if (resp.status === 429) {
                if (!proxyFetchEnabled) {
                  proxyFetchEnabled = true;
                  refreshProxies().catch(() => {});
                }
                const wait = Math.min(parseInt(resp.headers.get("Retry-After") || "2", 10) * 1000, 5000);
                await new Promise((r) => setTimeout(r, wait));
                continue;
              }
              throw new Error(`API error: ${resp.status}`);
            }
            const data = await resp.json();
            lastRequestTime = Date.now();
            await setCache(url, data);
            return data;
          } catch (e) {
            if (e && typeof e === 'object' && 'code' in e && (e.code === "ENOTFOUND" || e.code === "ECONNREFUSED" || e.code === "ECONNRESET")) {
              console.warn(`Proxy connection failed, retrying...`);
              continue;
            }
            if (attempt === 3) {
              console.warn(`Failed to fetch ${url}, skipping:`, e);
              return { data: [] };
            }
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
        return { data: [] };
      })
    );
    results.push(...batchResults);
    if (i + concurrency < urls.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return results;
}

async function fetchWithCache(url: string): Promise<any> {
  const cached = await getCached(url, CACHE_TIME);
  if (cached) return cached;

  try {
    const data = await rateLimitedFetch(url);
    if (!data || !data.data) {
      throw new Error("Empty API response");
    }
    await setCache(url, data);
    return data;
  } catch (error) {
    console.error("Fetch error for URL:", url, error);
    throw error;
  }
}

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
      small_image_url?: string;
    };
  };
  synopsis?: string;
  type?: string;
  episodes?: number;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  genres?: Array<{ mal_id: number; type: string; name: string }>;
  studios?: Array<{ mal_id: number; type: string; name: string }>;
  status?: string;
  rating?: string;
  year?: number;
  season?: string;
  aired?: {
    from?: string;
    to?: string;
    prop?: {
      from?: { day?: number; month?: number; year?: number };
      to?: { day?: number; month?: number; year?: number };
    };
  };
}

interface CommonAnime {
  id: string; name: string; jname: string; poster: string; banner?: string;
  episodes: { sub: number | null; dub: number | null };
  type: string; duration: string; rating: number | null; rank: number | null | undefined;
  description: string; genres: string[]; studios: string[];
  status: string; year: number | null | undefined; season: string | null | undefined;
}

function mapJikanAnimeToCommon(anime: JikanAnime, rank?: number): CommonAnime {
  return {
    id: String(anime.mal_id),
    name: anime.title_english || anime.title || "Unknown Title",
    jname: anime.title_japanese || anime.title || "Unknown",
    poster: anime.images.jpg.large_image_url || anime.images.jpg.image_url || "",
    episodes: {
      sub: anime.episodes || null,
      dub: null,
    },
    type: anime.type || "TV",
    duration: "24m",
    rating: anime.score || null,
    rank: rank || anime.rank,
    description: anime.synopsis || "",
    genres: anime.genres?.map((g) => g.name) || [],
    studios: anime.studios?.map((s) => s.name) || [],
    status: anime.status || "Unknown",
    year: anime.year,
    season: anime.season,
  };
}

export const hianime = {
  async getHomePage() {
    try {
      console.log("Fetching home page data from Jikan API...");

      const fetchSafe = async (url: string) => {
        try {
          return await fetchWithCache(url);
        } catch {
          return { data: [] };
        }
      };

      const [topAiring, topUpcoming, topPopular] = await Promise.all([
        fetchSafe(`${JIKAN_API}/top/anime?filter=airing&limit=25&page=1`),
        fetchSafe(`${JIKAN_API}/seasons/now?limit=25&page=1`),
        fetchSafe(`${JIKAN_API}/top/anime?filter=bypopularity&limit=25&page=1`),
      ]);

      const trendingData = topAiring.data || [];
      const upcomingData = topUpcoming.data || [];
      const popularData = topPopular.data || [];

      if (trendingData.length === 0 && upcomingData.length === 0) {
        console.warn("No anime data available from Jikan API");
        return {
          spotlightAnimes: [],
          trendingAnimes: [],
          latestEpisodeAnimes: [],
          topUpcomingAnimes: [],
          top10Animes: {
            today: [],
            week: [],
            month: [],
          },
          topAiringAnimes: [],
          mostPopularAnimes: [],
          mostFavoriteAnimes: [],
          latestCompletedAnimes: [],
          genres: [],
        };
      }

      const trendingList: CommonAnime[] = trendingData
        .slice(0, 25)
        .map((anime: JikanAnime, idx: number) =>
          mapJikanAnimeToCommon(anime, idx + 1)
        );

      const upcomingList: CommonAnime[] = upcomingData
        .slice(0, 25)
        .map((anime: JikanAnime, idx: number) =>
          mapJikanAnimeToCommon(anime, idx + 1)
        );

      const popularList: CommonAnime[] = popularData
        .slice(0, 25)
        .map((anime: JikanAnime, idx: number) =>
          mapJikanAnimeToCommon(anime, idx + 1)
        );

      const allAnime: CommonAnime[] = [
        ...trendingList,
        ...upcomingList.filter(
          (a) => !trendingList.some((t) => t.id === a.id)
        ),
        ...popularList.filter(
          (a) =>
            !trendingList.some((t) => t.id === a.id) &&
            !upcomingList.some((u) => u.id === a.id)
        ),
      ];

      const animeList = allAnime.slice(0, 30);

      const spotlightSlice = animeList.slice(0, 5);
      const malIds = spotlightSlice.map((a) => parseInt(a.id, 10)).filter((id) => id > 0);
      const bannerMap = malIds.length > 0 ? await getAnilistBanners(malIds).catch(() => new Map()) : new Map();

      const spotlightAnimes = spotlightSlice.map((anime, idx) => ({
        ...anime,
        banner: bannerMap.get(parseInt(anime.id, 10))?.bannerImage || undefined,
        description:
          (trendingData[idx] || {}).synopsis || "No description available",
        otherInfo: (trendingData[idx] || {}).genres || [],
      }));

      const latestEpisodeAnimes = animeList.slice(0, 20);
      const trendingAnimes = animeList.slice(0, 15);
      const topUpcomingAnimes = upcomingList.slice(0, 10);
      const mostPopularAnimes = popularList.slice(0, 15);
      const mostFavoriteAnimes = animeList
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 15);
      const latestCompletedAnimes = animeList.slice(15, 30);

      const allGenres = new Set<string>();
      animeList.forEach((anime) => {
        (anime.genres || []).forEach((genre) => allGenres.add(genre));
      });

      return {
        spotlightAnimes,
        trendingAnimes,
        latestEpisodeAnimes,
        topUpcomingAnimes,
        top10Animes: {
          today: latestEpisodeAnimes.slice(0, 10),
          week: trendingAnimes.slice(0, 10),
          month: mostPopularAnimes.slice(0, 10),
        },
        topAiringAnimes: trendingList.slice(0, 15),
        mostPopularAnimes,
        mostFavoriteAnimes,
        latestCompletedAnimes,
        genres: Array.from(allGenres),
      };
    } catch (error) {
      console.error("Error fetching home page:", error);
      return {
        spotlightAnimes: [],
        trendingAnimes: [],
        latestEpisodeAnimes: [],
        topUpcomingAnimes: [],
        top10Animes: {
          today: [],
          week: [],
          month: [],
        },
        topAiringAnimes: [],
        mostPopularAnimes: [],
        mostFavoriteAnimes: [],
        latestCompletedAnimes: [],
        genres: [],
      };
    }
  },

  async getInfo(id: string) {
    try {
      const [animeRes, relationsRes, charactersRes, recommendationsRes] = await Promise.all([
        fetchWithCache(`${JIKAN_API}/anime/${id}`),
        fetchWithCache(`${JIKAN_API}/anime/${id}/relations`).catch(() => ({ data: [] })),
        fetchWithCache(`${JIKAN_API}/anime/${id}/characters`).catch(() => ({ data: [] })),
        fetchWithCache(`${JIKAN_API}/anime/${id}/recommendations`).catch(() => ({ data: [] })),
      ]);

      if (!animeRes.data) {
        throw new Error("Anime not found");
      }

      const a = animeRes.data;

      const poster = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";

      const charactersVoiceActors = (charactersRes.data || []).slice(0, 20).map((ch: any) => ({
        character: {
          id: String(ch.character?.mal_id || ""),
          poster: ch.character?.images?.jpg?.image_url || "",
          name: ch.character?.name || "Unknown",
          cast: ch.role || "",
        },
        voiceActor: ch.voice_actors?.[0]
          ? {
              id: String(ch.voice_actors[0].person?.mal_id || ""),
              poster: ch.voice_actors[0].person?.images?.jpg?.image_url || "",
              name: ch.voice_actors[0].person?.name || "Unknown",
              cast: ch.voice_actors[0].language || "",
            }
          : {
              id: "",
              poster: "",
              name: "Unknown",
              cast: "",
            },
      }));

      const seasons = (relationsRes.data || []).filter((r: any) =>
        r.relation === "Sequel" || r.relation === "Prequel" || r.relation === "Side Story"
      ).map((r: any, idx: number) => ({
        id: String(r.entry?.[0]?.mal_id || ""),
        name: r.entry?.[0]?.name || `Related ${idx + 1}`,
        title: r.relation || "",
        poster: "",
        isCurrent: false,
      }));

      const recommendedAnimes = (recommendationsRes.data || []).slice(0, 10).map((rec: any) => {
        const entry = rec.entry;
        return {
          id: String(entry?.mal_id || ""),
          name: entry?.title || "Unknown",
          jname: "",
          poster: entry?.images?.jpg?.image_url || "",
          duration: "",
          type: "",
          rating: String(rec.votes || ""),
          episodes: { sub: 0, dub: 0 },
        };
      });

      const [bannerInfo] = await getAnilistBanners([a.mal_id]).then(m => [m.get(a.mal_id)]).catch(() => [undefined]);

      return {
        anime: {
          info: {
            id: String(a.mal_id),
            anilistId: bannerInfo?.id || 0,
            malId: a.mal_id,
            name: a.title_english || a.title || "Unknown",
            poster,
            banner: bannerInfo?.bannerImage || undefined,
            description: a.synopsis || "",
            stats: {
              rating: String(a.score || ""),
              quality: "HD",
              episodes: { sub: a.episodes || 0, dub: 0 },
              type: a.type || "TV",
              duration: a.duration || "",
            },
            promotionalVideos: [],
            charactersVoiceActors,
          },
          moreInfo: {
            japanese: a.title_japanese || "",
            synonyms: a.title || "",
            aired: a.aired?.string || "",
            premiered: `${a.season || ""} ${a.year || ""}`.trim(),
            duration: a.duration || "",
            status: a.status || "",
            malscore: String(a.score || ""),
            genres: (a.genres || []).map((g: any) => g.name),
            studios: (a.studios || []).map((s: any) => s.name).join(", "),
            producers: (a.producers || []).map((p: any) => p.name),
          },
        },
        seasons,
        mostPopularAnimes: [],
        relatedAnimes: [],
        recommendedAnimes,
      };
    } catch (error) {
      console.error("Error fetching anime info:", error);
      throw error;
    }
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    try {
      const data = await fetchWithCache(
        `${JIKAN_API}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20`
      );

      if (!data.data || data.data.length === 0) {
        return {
          animes: [],
          totalPages: 1,
          currentPage: page,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      const results = (data.data || []).map((item: JikanAnime) =>
        mapJikanAnimeToCommon(item)
      );

      return {
        animes: results,
        totalPages: data.pagination?.last_visible_page || 1,
        currentPage: page,
        hasNextPage: data.pagination?.has_next_page || false,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      console.error("Error searching anime:", error);
      return {
        animes: [],
        totalPages: 1,
        currentPage: page,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  },

  async getEpisodeServers(episodeId: string) {
    try {
      // Determine if episodeId is MAL style (e.g., "12345-3")
      const malMatch = /^([0-9]+)-([0-9]+)$/.exec(episodeId);
      let episodeNo = "0";

      if (malMatch) {
        episodeNo = malMatch[2];
      } else {
        // try to extract trailing number
        const parts = episodeId.split(/[-_:]/);
        const last = parts[parts.length - 1];
        if (/^[0-9]+$/.test(last)) episodeNo = last;
      }

      // Provide server list compatible with IEpisodeServers
      const MEGAPLAY_NAME = "MegaPlay";

      return {
        episodeId: episodeId,
        episodeNo: episodeNo,
        sub: [{ serverId: 1, serverName: MEGAPLAY_NAME }],
        dub: [{ serverId: 1, serverName: MEGAPLAY_NAME }],
        raw: [],
      };
    } catch (error) {
      console.error("Error fetching episode servers:", error);
      throw error;
    }
  },

  // Returns detailed source information (IEpisodeSource) for player
  async getEpisodeSources(episodeId: string, serverId?: number, category: "sub" | "dub" | "raw" = "sub") {
    try {
      const MEGAPLAY_BASE = "https://megaplay.buzz";

      // If episodeId is MAL style like "12345-3" -> use /stream/mal/{mal-id}/{ep-num}/{language}
      const malMatch = /^([0-9]+)-([0-9]+)$/.exec(episodeId);
      let streamUrl = "";
      let malID = 0;
      const anilistID = 0;

      if (malMatch) {
        malID = parseInt(malMatch[1], 10);
        const epNum = malMatch[2];
        streamUrl = `${MEGAPLAY_BASE}/stream/mal/${malID}/${epNum}/${category}`;
      } else if (/^[0-9]+$/.test(episodeId)) {
        // pure numeric - could be aniwatch episode id, try s-2
        streamUrl = `${MEGAPLAY_BASE}/stream/s-2/${episodeId}/${category}`;
      } else {
        // fallback: treat as aniwatch embed id
        streamUrl = `${MEGAPLAY_BASE}/stream/s-2/${encodeURIComponent(
          episodeId,
        )}/${category}`;
      }

      const data = {
        headers: {
          Referer: MEGAPLAY_BASE,
        },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [
          {
            url: streamUrl,
            type: "hls",
          },
        ],
        anilistID,
        malID,
      };

      return data;
    } catch (error) {
      console.error("Error building episode sources:", error);
      throw error;
    }
  },

  async getEpisodes(id: string) {
    const EP_CACHE_KEY = `episodes:${id}`;

    const fromCache = await getCached(EP_CACHE_KEY, 86400);
    if (fromCache) {
      episodeCountCache.set(id, fromCache.totalEpisodes);
      return fromCache;
    }

    try {
      const preSeeded = getPreSeededEpisodeCount(id);
      if (preSeeded !== null) {
        const episodes: any[] = [];
        for (let i = 1; i <= preSeeded; i++) {
          episodes.push({
            number: i,
            episodeId: `${id}-${i}`,
            title: `Episode ${i}`,
            isFiller: false,
          });
        }
        const result = { totalEpisodes: preSeeded, episodes };
        episodeCountCache.set(id, preSeeded);
        await setCache(EP_CACHE_KEY, result);
        return result;
      }

      const anilist = await getAnilistEpisodeCount(id);
      if (anilist.count !== null && anilist.count > 0) {
        const episodes: any[] = [];
        for (let i = 1; i <= anilist.count; i++) {
          episodes.push({
            number: i,
            episodeId: `${id}-${i}`,
            title: `Episode ${i}`,
            isFiller: false,
          });
        }
        const result = { totalEpisodes: anilist.count, episodes };
        episodeCountCache.set(id, anilist.count);
        await setCache(EP_CACHE_KEY, result);
        return result;
      }

      const fetchWithRetry = async (url: string) => {
        const cached = await getCached(url, CACHE_TIME);
        if (cached) return cached;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const useProxy = proxyFetchEnabled || (attempt >= 2);
            const proxyUrl = useProxy ? getNextProxy() : null;
            const r = await doFetch(url, !!proxyUrl, proxyUrl);
            if (r.ok) {
              const d = await r.json();
              await setCache(url, d);
              return d;
            }
            if (r.status === 429) {
              if (!proxyFetchEnabled) {
                proxyFetchEnabled = true;
                refreshProxies().catch(() => {});
              }
              const wait = Math.min(parseInt(r.headers.get("Retry-After") || "2", 10) * 1000, 5000);
              await new Promise((r) => setTimeout(r, wait));
              continue;
            }
            throw new Error(`API error: ${r.status}`);
          } catch (e: any) {
            if (e?.code === "ENOTFOUND" || e?.code === "ECONNREFUSED" || e?.code === "ECONNRESET") {
              continue;
            }
            if (attempt === 3) throw e;
            continue;
          }
        }
        throw new Error(`API error: 429 (exhausted retries)`);
      };

      const [firstPage, animeInfo] = await Promise.all([
        fetchWithRetry(`${JIKAN_API}/anime/${id}/episodes?page=1`).catch(() => ({ data: [], pagination: { last_visible_page: 1 } })),
        fetchWithRetry(`${JIKAN_API}/anime/${id}`).catch(() => ({ data: { episodes: 0 } })),
      ]);

      const totalEpisodesJikan = animeInfo.data?.episodes;
      const totalPages = firstPage.pagination?.last_visible_page || 1;

      let allData = firstPage.data || [];

      if (totalPages > 1) {
        const pageUrls: string[] = [];
        for (let p = 2; p <= totalPages; p++) {
          pageUrls.push(`${JIKAN_API}/anime/${id}/episodes?page=${p}`);
        }
        const results = await fetchAllWithConcurrency(pageUrls, 3);
        for (const page of results) {
          allData = allData.concat(page.data || []);
        }
      }

      const count = (totalEpisodesJikan && totalEpisodesJikan > 0)
        ? totalEpisodesJikan
        : Math.max(allData.length, firstPage.pagination?.items?.total || allData.length);

      const episodeMap = new Map<number, any>();
      for (const ep of allData) {
        const epNum = parseInt(ep.mal_id, 10) || parseInt(ep.episode, 10) || 0;
        if (epNum > 0) episodeMap.set(epNum, ep);
      }

      const episodes: any[] = [];
      for (let i = 1; i <= count; i++) {
        const ep = episodeMap.get(i);
        if (ep) {
          episodes.push({
            number: i,
            episodeId: `${id}-${i}`,
            title: ep.title || `Episode ${i}`,
            isFiller: ep.filler || false,
          });
        } else {
          episodes.push({
            number: i,
            episodeId: `${id}-${i}`,
            title: `Episode ${i}`,
            isFiller: false,
          });
        }
      }

      const result = { totalEpisodes: count, episodes };
      if (count > 0) {
        episodeCountCache.set(id, count);
        await setCache(EP_CACHE_KEY, result);
      }
      return result;
    } catch (error) {
      console.error("Error fetching episodes:", error);
      return { totalEpisodes: 0, episodes: [] };
    }
  },

  async searchSuggestions(query: string) {
    try {
      const data = await fetchWithCache(
        `${JIKAN_API}/anime?q=${encodeURIComponent(query)}&limit=8&page=1`
      );
      return (data.data || []).map((item: JikanAnime) => ({
        id: String(item.mal_id),
        name: item.title_english || item.title,
        jname: item.title_japanese || item.title,
        poster: item.images.jpg.image_url || "",
        type: item.type || "",
        rank: item.rank || null,
        episodes: { sub: item.episodes || null, dub: null },
        moreInfo: (item.genres || []).map((g: any) => g.name),
      }));
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      return [];
    }
  },

  async getEstimatedSchedule(_date?: string) {
    try {
      const data = await fetchWithCache(
        `${JIKAN_API}/seasons/now?limit=25&page=1`
      );

      return (data.data || [])
        .slice(0, 20)
        .map((item: JikanAnime) => {
          const airingDateStr = item.aired?.from || new Date().toISOString();
          const airingTimestamp = airingDateStr ? Date.parse(airingDateStr) : Date.now();
          const secondsUntilAiring = Math.max(0, Math.floor((airingTimestamp - Date.now()) / 1000));
          const time = new Date(airingTimestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          return {
            id: String(item.mal_id),
            name: item.title_english || item.title,
            jname: item.title_japanese || item.title,
            poster: item.images.jpg.large_image_url || item.images.jpg.image_url,
            airingTimestamp,
            secondsUntilAiring,
            time,
            episode: item.episodes || 0,
          };
        });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return [];
    }
  },
};
