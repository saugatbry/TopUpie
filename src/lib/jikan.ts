const JIKAN_API = "https://api.jikan.moe/v4";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function searchMalId(title: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${JIKAN_API}/anime?q=${encodeURIComponent(title)}&limit=5`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.data || [];
    if (!results.length) return null;

    const normTitle = normalize(title);

    const exact = results.find(
      (a: any) =>
        normalize(a.title) === normTitle ||
        normalize(a.title_english) === normTitle,
    );
    if (exact) return exact.mal_id;

    const tv = results.find(
      (a: any) =>
        a.type === "TV" &&
        (normalize(a.title).includes(normTitle) || normalize(a.title_english).includes(normTitle)),
    );
    if (tv) return tv.mal_id;

    return results[0].mal_id;
  } catch {
    return null;
  }
}

export async function getJikanInfo(malId: string) {
  try {
    const res = await fetch(`${JIKAN_API}/anime/${malId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Jikan error: ${res.status}`);
    const data = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
}
