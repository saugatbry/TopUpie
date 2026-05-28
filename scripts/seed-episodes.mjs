// Run: npm run seed:episodes
// Fetches episode counts from Jikan top anime and generates seed data
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, "..", "src", "data", "episode-counts.ts");

const results = {};
const maxPages = 25;

async function fetchPage(page) {
  const url = `https://api.jikan.moe/v4/top/anime?page=${page}`;
  const r = await fetch(url);
  const d = await r.json();
  return d.data || [];
}

async function main() {
  console.log("Fetching episode counts from Jikan top anime...");
  for (let p = 1; p <= maxPages; p++) {
    try {
      const animes = await fetchPage(p);
      for (const a of animes) {
        if (a.episodes && a.episodes > 0) {
          results[a.mal_id] = a.episodes;
        }
      }
      console.log(`  Page ${p}/${maxPages}: ${animes.length} items (${Object.keys(results).length} total)`);
    } catch (e) {
      console.log(`  Page ${p} failed: ${e.message}`);
    }
    if (p < maxPages) await new Promise((r) => setTimeout(r, 500));
  }

  const entries = Object.entries(results)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  let output = "const episodeCounts: Record<string, number> = {\n";
  for (const [id, count] of entries) {
    output += `  "${id}": ${count},\n`;
  }
  output += "};\n\n";
  output += 'export function getPreSeededEpisodeCount(animeId: string): number | null {\n';
  output += '  return episodeCounts[animeId] ?? null;\n';
  output += '}\n';

  writeFileSync(outputPath, output, "utf-8");
  console.log(`\nDone! Saved ${entries.length} anime to ${outputPath}`);
}

main().catch(console.error);
