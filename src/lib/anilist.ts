const ANILIST_API = "https://graphql.anilist.co";

const EPISODE_COUNT_QUERY = `query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    episodes
    status
  }
}`;

export async function getAnilistEpisodeCount(malId: string): Promise<{
  count: number | null;
  status: string | null;
}> {
  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: EPISODE_COUNT_QUERY,
        variables: { idMal: parseInt(malId, 10) },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { count: null, status: null };

    const json = await res.json();
    if (json?.errors) return { count: null, status: null };

    const media = json?.data?.Media;
    return {
      count: media?.episodes ?? null,
      status: media?.status ?? null,
    };
  } catch {
    return { count: null, status: null };
  }
}
