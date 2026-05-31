const ANIVERSE_STREAM = "https://aniverseapi.vercel.app/api/stream";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const season = searchParams.get("season") || "1";
    const ep = searchParams.get("ep") || "1";

    if (!id) {
      return Response.json({ error: "id parameter is required" }, { status: 400 });
    }

    const res = await fetch(
      `${ANIVERSE_STREAM}?id=${encodeURIComponent(id)}&season=${season}&ep=${ep}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.log(err);
    return Response.json({ success: false, results: [] }, { status: 500 });
  }
}
