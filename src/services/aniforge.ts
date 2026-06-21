const API_BASE = "https://anikototvapi.vercel.app/api";

function fetchWithRetry(url: string, retries = 2): Promise<any> {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
      })
        .then((res) => {
          clearTimeout(timeout);
          if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
          return res.json();
        })
        .then((json) => resolve(json?.results ?? json))
        .catch((err) => {
          clearTimeout(timeout);
          if (n < retries) {
            const delay = Math.min(1000 * Math.pow(2, n), 4000);
            setTimeout(() => attempt(n + 1), delay);
          } else {
            reject(err);
          }
        });
    };
    attempt(1);
  });
}

function extractSlug(idOrSlug: string): string {
  return idOrSlug.split("/")[0];
}

export const homeService = {
  async getHome() {
    return fetchWithRetry(`${API_BASE}/`);
  },
  async getTrending() {
    return fetchWithRetry(`${API_BASE}/trending`);
  },
  async getTop(page = 1) {
    return fetchWithRetry(`${API_BASE}/most-popular?page=${page}`);
  },
  async getTopAiring() {
    return fetchWithRetry(`${API_BASE}/`);
  },
  async getMostPopular(page = 1) {
    return fetchWithRetry(`${API_BASE}/most-popular?page=${page}`);
  },
  async getMostFavorite(page = 1) {
    return fetchWithRetry(`${API_BASE}/most-popular?page=${page}`);
  },
  async getTopUpcoming() {
    return { data: [] };
  },
  async getRecentlyAdded(page = 1) {
    return fetchWithRetry(`${API_BASE}/newly-added?page=${page}`);
  },
  async getRecentlyUpdated(page = 1) {
    return fetchWithRetry(`${API_BASE}/new-release?page=${page}`);
  },
  async getMovies(page = 1) {
    return fetchWithRetry(`${API_BASE}/type/movie?page=${page}`);
  },
  async getTV(page = 1) {
    return fetchWithRetry(`${API_BASE}/type/tv?page=${page}`);
  },
  async getOVA(page = 1) {
    return fetchWithRetry(`${API_BASE}/type/ova?page=${page}`);
  },
  async getONA(page = 1) {
    return fetchWithRetry(`${API_BASE}/type/ona?page=${page}`);
  },
  async getSpecial(page = 1) {
    return fetchWithRetry(`${API_BASE}/type/special?page=${page}`);
  },
  async getSubbed() {
    return { data: [] };
  },
  async getDubbed() {
    return { data: [] };
  },
  async getCompleted() {
    return { data: [] };
  },
  async getSeasonal() {
    return { data: [] };
  },
  async getTop10() {
    return fetchWithRetry(`${API_BASE}/top-ten`);
  },
  async getAZList(letter: string) {
    return fetchWithRetry(`${API_BASE}/az-list/${letter}?page=1`);
  },
  async getByGenre(genre: string) {
    return fetchWithRetry(`${API_BASE}/genre/${encodeURIComponent(genre.toLowerCase())}?page=1`);
  },
  async getByProducer() {
    return { data: [] };
  },
  async getRandom() {
    return fetchWithRetry(`${API_BASE}/random`);
  },
};

export const animeService = {
  async getById(id: string) {
    const slug = extractSlug(id);
    return fetchWithRetry(`${API_BASE}/info?id=${slug}`);
  },
  async getByMalId() {
    return {};
  },
  async getByAniListId() {
    return {};
  },
  async findId() {
    return {};
  },
  async getEpisodes(id: string) {
    const slug = extractSlug(id);
    return fetchWithRetry(`${API_BASE}/episodes/${slug}`);
  },
  async getCharacters() {
    return { data: [] };
  },
  async getStaff() {
    return { data: [] };
  },
  async getRelations() {
    return { data: [] };
  },
  async getRecommendations() {
    return { data: [] };
  },
  async getExternal() {
    return { data: [] };
  },
  async getPromotions() {
    return { data: [] };
  },
  async getMoreSeasons() {
    return { data: [] };
  },
  async getEpisodeDetail() {
    return {};
  },
  async getWatch(slug: string, ep: number) {
    return fetchWithRetry(`${API_BASE}/watch?slug=${slug}&ep=${ep}`);
  },
  async getServers(ids: string) {
    return fetchWithRetry(`${API_BASE}/servers?ids=${encodeURIComponent(ids)}`);
  },
  async getStream(id: string) {
    return fetchWithRetry(`${API_BASE}/stream?id=${encodeURIComponent(id)}`);
  },
};

export const searchService = {
  async search(query: string, page = 1) {
    return fetchWithRetry(`${API_BASE}/search?keyword=${encodeURIComponent(query)}&page=${page}`);
  },
  async legacySearch(query: string) {
    return fetchWithRetry(`${API_BASE}/search/suggest?keyword=${encodeURIComponent(query)}`);
  },
  async suggestion(query: string) {
    return fetchWithRetry(`${API_BASE}/search/suggest?keyword=${encodeURIComponent(query)}`);
  },
  async trendingSearch() {
    return { data: [] };
  },
  async advancedFilter(params: Record<string, string>) {
    const qs = new URLSearchParams({ keyword: "", ...params }).toString();
    return fetchWithRetry(`${API_BASE}/filter?${qs}`);
  },
  async getFilterOptions() {
    return {};
  },
};

export const metadataService = {
  async getGenres() {
    return fetchWithRetry(`${API_BASE}/`);
  },
  async getTags() {
    return { data: [] };
  },
  async getStudios() {
    return { data: [] };
  },
};

export const seriesService = {
  async getSeries() {
    return { data: [] };
  },
  async getSeriesBySlug() {
    return {};
  },
};

export const characterService = {
  async getAll() {
    return { data: [] };
  },
  async getTop() {
    return { data: [] };
  },
  async getById() {
    return {};
  },
  async getVoices() {
    return { data: [] };
  },
  async getAnime() {
    return { data: [] };
  },
};

export const peopleService = {
  async getAll() {
    return { data: [] };
  },
  async getTop() {
    return { data: [] };
  },
  async getById() {
    return {};
  },
  async getRoles() {
    return { data: [] };
  },
  async getCharacters() {
    return { data: [] };
  },
};

export const scheduleService = {
  async getSchedules(date?: string) {
    const qs = date ? `?date=${date}` : "";
    return fetchWithRetry(`${API_BASE}/schedule${qs}`);
  },
  async getNextAiring() {
    return {};
  },
};

export const mappingService = {
  async malToAniList() {
    return {};
  },
  async aniListToMal() {
    return {};
  },
};

export const playerService = {
  embedUrl(params: { server?: string; id?: string; episode: number; type: "sub" | "dub" }) {
    if (params.id) return `${API_BASE}/stream?id=${encodeURIComponent(params.id)}`;
    return "";
  },
  embedUrlById(embedId: string) {
    return `${API_BASE}/stream?id=${encodeURIComponent(embedId)}`;
  },
};
