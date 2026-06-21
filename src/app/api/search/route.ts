import { hianime } from "@/lib/hianime";
import { SearchAnimeParams } from "@/types/anime";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseSearchParams(searchParams);

    const results = await hianime.search(params.q, params.page).catch(() => ({
      animes: [], totalPages: 1, hasNextPage: false, currentPage: 1,
    }));

    return Response.json({
      data: {
        animes: results?.animes || [],
        totalPages: results?.totalPages || 1,
        hasNextPage: results?.hasNextPage || false,
        currentPage: params.page,
      },
    });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}

const parseSearchParams = (
  searchParams: URLSearchParams,
): SearchAnimeParams => {
  const getString = (key: string) => {
    const val = searchParams.get(key);
    return val === null ? undefined : val;
  };

  const getNumber = (key: string) => {
    const val = searchParams.get(key);
    const num = val ? parseInt(val, 10) : undefined;
    return num === undefined || isNaN(num) ? undefined : num;
  };

  return {
    q: getString("q") || "",
    page: getNumber("page") || 1,
    type: getString("type"),
    status: getString("status"),
    rated: getString("rated"),
    season: getString("season"),
    language: getString("language"),
    sort: getString("sort"),
    genres: getString("genres"),
  };
};
