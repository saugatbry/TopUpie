const JIKAN_API = "https://api.jikan.moe/v4";

export async function searchMalId(title: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${JIKAN_API}/anime?q=${encodeURIComponent(title)}&limit=1`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.mal_id ?? null;
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
