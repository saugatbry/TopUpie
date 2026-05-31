import { getCached, setCache } from "./cache";

const API_BASE = "https://kageread-api.vercel.app/api";
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

export interface MangaChapter {
  id: string;
  number: string;
  title: string;
  url: string;
}

export interface MangaChapterList {
  mangaName: string;
  chapters: MangaChapter[];
}

export async function getMangaChapters(name: string, start = 1, end = 1000): Promise<MangaChapterList> {
  const data = await fetchJson(`${API_BASE}/manga/chapters?name=${encodeURIComponent(name)}&start=${start}&end=${end}`);
  return {
    mangaName: data?.mangaName || name,
    chapters: (data?.chapters || []).map((ch: any) => ({
      id: ch.id || ch.url?.split("/").pop() || "",
      number: ch.number || "",
      title: ch.title || `Chapter ${ch.number}`,
      url: ch.url || "",
    })),
  };
}

export interface ChapterImage {
  page: number;
  url: string;
}

export async function getChapterImages(url: string): Promise<ChapterImage[]> {
  const data = await fetchJson(`${API_BASE}/manga/images?url=${encodeURIComponent(url)}`);
  const images = data?.images || data?.data || [];
  return images.map((img: any, i: number) => ({
    page: i + 1,
    url: typeof img === "string" ? img : (img.url || img.src || ""),
  }));
}
