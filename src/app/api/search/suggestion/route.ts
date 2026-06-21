import { hianime } from "@/lib/hianime";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") as string;

    const results = await hianime.searchSuggestions(q).catch(() => []);

    return Response.json({ data: results.slice(0, 12) });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
