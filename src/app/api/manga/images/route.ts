import { getChapterImages } from "@/lib/manga";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") as string;

    if (!url) {
      return Response.json({ error: "url parameter is required" }, { status: 400 });
    }

    const data = await getChapterImages(url);
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
