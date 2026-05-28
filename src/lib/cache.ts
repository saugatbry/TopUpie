import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), ".cache");

async function ensureDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

function keyToFile(key: string): string {
  const hash = crypto.createHash("md5").update(key).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

export async function getCached(key: string, maxAge: number): Promise<any | null> {
  try {
    const raw = await fs.readFile(keyToFile(key), "utf-8");
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts < maxAge * 1000) return entry.data;
    return null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: any) {
  try {
    await ensureDir();
    await fs.writeFile(keyToFile(key), JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // cache is best-effort; failures (read-only fs, no space) should not break the app
  }
}
