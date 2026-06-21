import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { homeService } from "@/services/aniforge";

export default async function GenrePage({
  params: paramsPromise,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await paramsPromise;
  const decoded = decodeURIComponent(genre);
  let items: any[] = [];
  try {
    const res = await homeService.getByGenre(decoded);
    const data = (res as any)?.data || (Array.isArray(res) ? res : []);
    items = Array.isArray(data) ? data : [];
  } catch {
    // API unavailable
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-8 capitalize">{decoded} Anime</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">No anime found for this genre.</p>
      ) : (
        <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5">
          {items.map((item: any, idx: number) => (
            <AnimeCard
              key={idx}
              title={item.title || item.name || "Unknown"}
              poster={item.poster || ""}
              subTitle={item.type || ""}
              href={`${ROUTES.ANIME_DETAILS}/${item.slug?.split("/")[0] || item.slug || item.id}`}
              sub={item.sub ?? null}
              dub={item.dub ?? null}
              className="self-center justify-self-center"
            />
          ))}
        </div>
      )}
    </Container>
  );
}
