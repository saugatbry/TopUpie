// Using Anify API - a reliable anime API aggregator
const ANIFY_API = "https://api.anify.tv";
const CACHE_TIME = 3600; // 1 hour cache

interface AnimeData {
  id: string;
  title?: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  image?: string;
  poster?: string;
  description?: string;
  rating?: number;
  type?: string;
  episodes?: number;
  status?: string;
  season?: string;
  year?: number;
  genres?: string[];
  studios?: string[];
}

interface CachedData {
  data: any;
  timestamp: number;
}

// Cache storage
const cache = new Map<string, CachedData>();

async function fetchWithCache(url: string): Promise<any> {
  const cacheKey = url;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TIME * 1000) {
    return cached.data;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} for ${url}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      console.error("Empty response from API:", url);
      throw new Error("Empty API response");
    }

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("Fetch error for URL:", url, error);
    throw error;
  }
}

function mapAnimeToCommon(anime: AnimeData, rank?: number) {
  return {
    id: anime.id || "unknown",
    name: anime.title?.english || anime.title?.romaji || "Unknown Title",
    jname: anime.title?.native || anime.title?.romaji || "Unknown",
    poster: anime.image || anime.poster || "",
    episodes: {
      sub: anime.episodes || null,
      dub: null,
    },
    type: anime.type || "TV",
    duration: "24m",
    rating: anime.rating || null,
    rank: rank,
    description: anime.description || "",
    genres: anime.genres || [],
  };
}

// Generates trending/popular anime by using trending searches
async function getTrendingAnime() {
  try {
    // Fetch from multiple sources to ensure we get data
    const urls = [
      `${ANIFY_API}/trending?type=ANIME&page=1&perPage=20`,
      `${ANIFY_API}/popular?type=ANIME&page=1&perPage=20`,
    ];

    let animeList: AnimeData[] = [];

    for (const url of urls) {
      try {
        const data = await fetchWithCache(url);
        if (data && Array.isArray(data)) {
          animeList = animeList.concat(data.slice(0, 15 - animeList.length));
          if (animeList.length >= 15) break;
        }
      } catch (err) {
        console.warn(`Failed to fetch from ${url}:`, err);
        continue;
      }
    }

    return animeList;
  } catch (error) {
    console.error("Error fetching trending anime:", error);
    return [];
  }
}

export const hianime = {
  async getHomePage() {
    try {
      // Fetch trending anime
      const trendingData = await getTrendingAnime();

      if (trendingData.length === 0) {
        console.warn("No anime data available from any source");
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

      const animeList = trendingData.map((anime, idx) =>
        mapAnimeToCommon(anime, idx + 1)
      );

      // Split data for different sections
      const spotlightAnimes = animeList.slice(0, 5).map((anime, idx) => ({
        ...anime,
        description:
          trendingData[idx]?.description || "No description available",
        otherInfo: trendingData[idx]?.genres || [],
      }));

      const latestEpisodeAnimes = animeList.slice(0, 20);
      const trendingAnimes = animeList.slice(0, 15);
      const topUpcomingAnimes = animeList.slice(5, 15);
      const mostPopularAnimes = animeList.slice(10, 25);
      const mostFavoriteAnimes = animeList
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 15);
      const latestCompletedAnimes = animeList.slice(15, 30);

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
        topAiringAnimes: animeList.slice(0, 15),
        mostPopularAnimes,
        mostFavoriteAnimes,
        latestCompletedAnimes,
        genres: trendingData[0]?.genres || [],
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
      const data = await fetchWithCache(`${ANIFY_API}/info?id=${id}`);

      if (!data) {
        throw new Error("Anime not found");
      }

      return {
        id: data.id || id,
        title: data.title?.english || data.title?.romaji || "Unknown",
        image: data.image || data.poster || "",
        poster: data.image || data.poster || "",
        description: data.description || "",
        type: data.type || "TV",
        totalEpisodes: data.episodes || 0,
        episodes: Array.from({ length: data.episodes || 0 }, (_, i) => ({
          number: i + 1,
          id: `${id}-${i + 1}`,
          title: `Episode ${i + 1}`,
          isFiller: false,
        })),
      };
    } catch (error) {
      console.error("Error fetching anime info:", error);
      throw error;
    }
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    try {
      const data = await fetchWithCache(
        `${ANIFY_API}/search?query=${encodeURIComponent(query)}&page=${page}&type=ANIME`
      );

      if (!data || !data.results) {
        return {
          animes: [],
          totalPages: 1,
          currentPage: page,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      const results = (data.results || []).map((item: AnimeData) =>
        mapAnimeToCommon(item)
      );

      return {
        animes: results,
        totalPages: data.totalPages || 1,
        currentPage: page,
        hasNextPage: page < (data.totalPages || 1),
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
      // This is a simplified version - in production you'd want actual stream links
      return {
        servers: [
          {
            serverName: "Default",
            serverId: "default",
            category: "sub",
            urls: [
              {
                url: `https://placeholder.example.com/${episodeId}`,
                priority: 1,
                category: "sub",
              },
            ],
          },
        ],
        episodeId: episodeId,
        episodeNumber: 0,
      };
    } catch (error) {
      console.error("Error fetching episode servers:", error);
      throw error;
    }
  },

  async getEstimatedSchedule(_date?: string) {
    try {
      const data = await getTrendingAnime();

      return (data || []).map((item: AnimeData) => ({
        id: item.id,
        name: item.title?.english || item.title?.romaji || "Unknown",
        jname: item.title?.native || item.title?.romaji || "Unknown",
        poster: item.image || item.poster || "",
        airingDate: new Date().toISOString(),
        episode: item.episodes || 0,
      }));
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return [];
    }
  },
};
