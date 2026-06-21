import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import { homeService } from "@/services/aniforge";

export async function generateStaticParams() {
  return "abcdefghijklmnopqrstuvwxyz".split("").map((letter) => ({ letter }));
}

export default async function AZListPage({
  params: paramsPromise,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await paramsPromise;
  let items: any[] = [];
  try {
    const res = await homeService.getAZList(letter);
    const data = (res as any)?.data || (Array.isArray(res) ? res : []);
    items = Array.isArray(data) ? data : [];
  } catch {
    // API unavailable
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-2">A-Z Anime List</h1>
      <p className="text-gray-400 mb-8">
        Browse anime titles starting with &ldquo;{letter.toUpperCase()}&rdquo;
      </p>
      <div className="flex flex-wrap gap-2 mb-10">
        {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => (
          <a
            key={l}
            href={`/anime/az-list/${l}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              l === letter
                ? "bg-[#e9376b] text-white"
                : "bg-secondary text-gray-300 hover:bg-slate-700"
            }`}
          >
            {l.toUpperCase()}
          </a>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500">No anime found for this letter.</p>
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
