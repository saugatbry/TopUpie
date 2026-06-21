const API_BASE = "https://anikototvapi.vercel.app/api";

export async function GET(
  request: Request,
  props: { params: Promise<{ slugs: string[] }> },
) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);
  const path = params.slugs.join("/");
  const query = searchParams.toString();
  const url = `${API_BASE}/${path}${query ? `?${query}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return Response.json({ error: `API ${res.status}` }, { status: res.status });
    }
    const raw = await res.json();
    const data = raw?.results ?? raw;
    return Response.json(data);
  } catch (err) {
    console.error("Proxy error:", url, err);
    return Response.json({ error: "proxy failed" }, { status: 502 });
  }
}
