import { hianime } from "@/lib/hianime";
import { searchMalId } from "@/lib/jikan";

const JIKAN_API = "https://api.jikan.moe/v4";

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") as string;

    const [hindiResults, jikanRaw] = await Promise.all([
      hianime.searchSuggestions(q).catch(() => []),
      fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(q)}&limit=8&page=1`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.json()).catch(() => ({ data: [] })),
    ]);

    const jikanResults = (jikanRaw.data || []).map((item: any) => ({
      id: String(item.mal_id),
      name: item.title_english || item.title || "Unknown",
      jname: item.title_japanese || "",
      poster: item.images?.jpg?.image_url || "",
      type: item.type || "TV",
      rank: item.rank || null,
      episodes: { sub: item.episodes || null, dub: null },
      moreInfo: (item.genres || []).map((g: any) => g.name),
      provider: "subdub" as const,
    }));

    const hindiMapped = (hindiResults || []).map((item: any) => ({
      ...item,
      provider: "hindi" as const,
    }));

    const mergedMap = new Map<string, any>();

    for (const item of jikanResults) {
      mergedMap.set(normalizeTitle(item.name), { ...item });
    }

    for (const item of hindiMapped) {
      const key = normalizeTitle(item.name);
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        existing.provider = "both" as const;
        existing.name = existing.name.length >= item.name.length ? existing.name : item.name;
      } else {
        mergedMap.set(key, { ...item });
      }
    }

    const merged = Array.from(mergedMap.values()).slice(0, 12);

    return Response.json({ data: merged });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
