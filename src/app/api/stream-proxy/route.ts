const ANIME_API = "https://anikototvapi.vercel.app/api";

const AD_SCRIPTS = [
  "statlytic.net",
  "cloudflareinsights.com/beacon.min.js",
  "googleads",
  "doubleclick",
  "googlesyndication",
  "adservice",
  "popunder",
  "popup",
];

const AD_CSS = `
.mg-3mb3d > :not(.mg3-player) { display: none !important; }
[id*="google"] { display: none !important; }
[id*="ad"] { display: none !important; }
[class*="ad"] { display: none !important; }
[class*="popup"] { display: none !important; }
[class*="overlay"] { display: none !important; }
ins.adsbygoogle { display: none !important; }
`;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Referer": "https://anikototv.to/",
  "DNT": "1",
};

function isAdScript(src: string): boolean {
  if (!src) return false;
  return AD_SCRIPTS.some((ad) => src.toLowerCase().includes(ad));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing stream id", { status: 400 });
  }

  try {
    const streamRes = await fetch(
      `${ANIME_API}/stream?id=${encodeURIComponent(id)}`,
      { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(10000) },
    );
    if (!streamRes.ok) {
      return new Response("Failed to resolve stream", { status: 502 });
    }
    const streamJson = await streamRes.json();
    const streamUrl = streamJson?.results?.url || streamJson?.url;
    if (!streamUrl) {
      return new Response(fallbackHtml("Stream not available"), {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    }

    const pageRes = await fetch(streamUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(20000),
    });
    if (!pageRes.ok) {
      return new Response(fallbackHtml(streamUrl), {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    }

    const contentType = pageRes.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return new Response(fallbackHtml(streamUrl), {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    }

    let html = await pageRes.text();

    html = html.replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      (match) => {
        const srcMatch = match.match(/src\s*=\s*["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : "";
        if (isAdScript(src)) return "";
        const content = match.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        if (/adf.ly|adfocus|popunder|popup|window\.open/i.test(content)) return "";
        return match;
      },
    );

    html = html.replace(
      /<link[^>]*href\s*=\s*["'][^"']*(?:statlytic|doubleclick|googleads)[^"']*["'][^>]*>/gi,
      "",
    );

    html = html.replace(
      /<iframe[^>]*src\s*=\s*["'][^"']*(?:doubleclick|googleads|adservice)[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi,
      "",
    );

    html = html.replace("</head>", `<style>${AD_CSS}</style></head>`);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "X-Frame-Options": "SAMEORIGIN",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new Response("Stream proxy error", { status: 502 });
  }
}

function fallbackHtml(url: string): string {
  return `<!DOCTYPE html><html><body><script>location.href=${JSON.stringify(url)}</script></body></html>`;
}
