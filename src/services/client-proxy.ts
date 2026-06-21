import { api } from "@/lib/api";

async function proxyGet(path: string) {
  const res = await api.get(`/api/proxy${path}`);
  return res.data;
}

export const proxyHomeService = {
  getTrending: () => proxyGet("/trending"),
  getTop: (page: number) => proxyGet(`/most-popular?page=${page}`),
  getMovies: (page = 1) => proxyGet(`/type/movie?page=${page}`),
  getRandom: () => proxyGet("/random"),
};

export const proxyCharacterService = {
  getAll: (_page?: number) => Promise.resolve({ data: [] }),
  getById: (_id: number) => Promise.resolve({} as any),
  getVoices: (_id: number) => Promise.resolve({ data: [] }),
  getAnime: (_id: number) => Promise.resolve({ data: [] }),
};

export const proxyPeopleService = {
  getAll: (_page?: number) => Promise.resolve({ data: [] }),
  getById: (_id: number) => Promise.resolve({} as any),
  getRoles: (_id: number) => Promise.resolve({ data: [] }),
  getCharacters: (_id: number) => Promise.resolve({ data: [] }),
};

export const proxyScheduleService = {
  getSchedules: (date?: string) =>
    proxyGet(`/schedule${date ? `?date=${date}` : ""}`),
};

export const proxyMetadataService = {
  getGenres: async () => {
    const res = await proxyGet("/");
    return { data: res?.genres || [] };
  },
  getStudios: () => Promise.resolve({ data: [] }),
};

export const proxySeriesService = {
  getSeriesBySlug: (_slug: string) => Promise.resolve({ data: null } as any),
};

export const proxyMappingService = {
  malToAniList: (_id: number) => Promise.resolve({ data: null } as any),
  aniListToMal: (_id: number) => Promise.resolve({ data: null } as any),
};
