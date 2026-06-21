import { getMangaChapters } from "@/lib/manga";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") as string;
    const start = parseInt(searchParams.get("start") || "1");
    const end = parseInt(searchParams.get("end") || "1000");

    if (!name) {
      return Response.json({ error: "name parameter is required" }, { status: 400 });
    }

    const data = await getMangaChapters(name, start, end);
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
