const PROXY_LIST_URL = "https://raw.githubusercontent.com/iplocate/free-proxy-list/refs/heads/main/all-proxies.txt";
const REFRESH_INTERVAL = 5 * 60 * 1000; // refresh every 5 minutes

let httpProxies: string[] = [];
let currentIndex = 0;
let lastRefresh = 0;

async function fetchProxyList(): Promise<string[]> {
  try {
    const res = await fetch(PROXY_LIST_URL, { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    return text.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function refreshProxies(): Promise<void> {
  httpProxies = (await fetchProxyList()).filter(
    (p) => p.startsWith("http://") || p.startsWith("https://"),
  );
  lastRefresh = Date.now();
}

export function getNextProxy(): string | null {
  if (Date.now() - lastRefresh > REFRESH_INTERVAL) {
    refreshProxies().catch(() => {});
  }
  if (httpProxies.length === 0) return null;
  const proxy = httpProxies[currentIndex % httpProxies.length];
  currentIndex++;
  return proxy;
}
