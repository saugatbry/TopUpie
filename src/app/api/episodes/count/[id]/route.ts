import { getAnilistEpisodeCount } from "@/lib/anilist";
import { getCached, setCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  if (!/^\d+$/.test(id)) {
    return Response.json({ count: null, status: null }, { status: 400 });
  }

  const CACHE_KEY = `anilist:episodes:${id}`;
  const MAX_AGE = 86400;

  const cached = await getCached(CACHE_KEY, MAX_AGE);
  if (cached) {
    return Response.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  }

  const result = await getAnilistEpisodeCount(id);

  if (result.count !== null) {
    await setCache(CACHE_KEY, result);
  }

  return Response.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
