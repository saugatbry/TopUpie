import { aniverse } from "./aniverse";

export const hianime = {
  async getHomePage() {
    return aniverse.getHomePage();
  },

  async getInfo(id: string) {
    return aniverse.getInfo(id);
  },

  async search(query: string, page: number = 1, _filters?: Record<string, any>) {
    return aniverse.search(query, page);
  },

  async getEpisodes(id: string) {
    return aniverse.getEpisodes(id);
  },

  async getEpisodeServers(episodeId: string) {
    return aniverse.getEpisodeServers(episodeId);
  },

  async getEpisodeSources(episodeId: string, serverId?: number, _category?: string) {
    return aniverse.getEpisodeSources(episodeId, serverId);
  },

  async searchSuggestions(query: string) {
    return aniverse.searchSuggestions(query);
  },

  async getEstimatedSchedule(date?: string) {
    return aniverse.getEstimatedSchedule();
  },
};
