import { aniverse } from "./aniverse";
import { getJikanInfo } from "./jikan";
import { getPreSeededEpisodeCount } from "@/data/episode-counts";
import { getCached, setCache } from "./cache";

const MEGAPLAY_BASE = "https://megaplay.buzz";
const isMAL = (id: string) => /^\d+$/.test(id);
const isMALEpsiode = (id: string) => /^\d+-\d+$/.test(id);
const CACHE_TIME = 3600;

function parseMALEpisode(episodeId: string): { malId: string; ep: string } | null {
  const match = /^(\d+)-(\d+)$/.exec(episodeId);
  return match ? { malId: match[1], ep: match[2] } : null;
}

export const hianime = {
  async getHomePage() {
    return aniverse.getHomePage();
  },

  async getInfo(id: string) {
    if (isMAL(id)) {
      const a = await getJikanInfo(id);
      if (!a) throw new Error("Anime not found");
      return {
        anime: {
          info: {
            id: String(a.mal_id),
            anilistId: 0,
            malId: a.mal_id,
            name: a.title_english || a.title || "Unknown",
            poster: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "",
            description: a.synopsis || "",
            stats: {
              rating: String(a.score || ""),
              quality: "HD",
              episodes: { sub: a.episodes || 0, dub: 0 },
              type: a.type || "TV",
              duration: a.duration || "",
            },
            promotionalVideos: [],
            charactersVoiceActors: [],
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
        seasons: [],
        mostPopularAnimes: [],
        relatedAnimes: [],
        recommendedAnimes: [],
      };
    }
    return aniverse.getInfo(id);
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    return aniverse.search(query, page);
  },

  async getEpisodes(id: string) {
    if (isMAL(id)) {
      const EP_CACHE_KEY = `episodes:${id}`;
      const fromCache = await getCached(EP_CACHE_KEY, 86400);
      if (fromCache) return fromCache;

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
        await setCache(EP_CACHE_KEY, result);
        return result;
      }

      try {
        const a = await getJikanInfo(id);
        const total = a?.episodes || 0;
        const episodes: any[] = [];
        for (let i = 1; i <= total; i++) {
          episodes.push({
            number: i,
            episodeId: `${id}-${i}`,
            title: `Episode ${i}`,
            isFiller: false,
          });
        }
        const result = { totalEpisodes: total, episodes };
        await setCache(EP_CACHE_KEY, result);
        return result;
      } catch {
        return { totalEpisodes: 0, episodes: [] };
      }
    }
    return aniverse.getEpisodes(id);
  },

  async getEpisodeServers(episodeId: string) {
    if (isMALEpsiode(episodeId)) {
      const parsed = parseMALEpisode(episodeId);
      return {
        episodeId,
        episodeNo: parsed?.ep || "1",
        sub: [{ serverId: 1, serverName: "MegaPlay" }],
        dub: [{ serverId: 2, serverName: "MegaPlay" }],
        raw: [],
      };
    }
    return aniverse.getEpisodeServers(episodeId);
  },

  async getEpisodeSources(episodeId: string, serverId?: number, _category?: string) {
    if (isMALEpsiode(episodeId)) {
      const parsed = parseMALEpisode(episodeId);
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
      const category = _category || "sub";
      const streamUrl = `${MEGAPLAY_BASE}/stream/mal/${parsed.malId}/${parsed.ep}/${category}`;
      return {
        headers: { Referer: MEGAPLAY_BASE },
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        sources: [{ url: streamUrl, type: "hls" }],
        anilistID: 0,
        malID: parseInt(parsed.malId, 10),
      };
    }
    return aniverse.getEpisodeSources(episodeId, serverId);
  },

  async searchSuggestions(query: string) {
    return aniverse.searchSuggestions(query);
  },

  async getEstimatedSchedule(_date?: string) {
    return aniverse.getEstimatedSchedule();
  },
};
