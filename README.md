# TopUpie Anime

Watch anime anywhere, anytime. No ads.

Built with [Next.js 15](https://nextjs.org/), data sourced from [AniKotoAPI](https://anikototvapi.vercel.app/).

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS, Shadcn/ui, Radix UI
- **State:** Zustand, React Query (v3)
- **Video:** ArtPlayer, HLS.js
- **Icons:** Lucide React
- **Auth:** localStorage-based (no real backend)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables needed.

## Architecture

### Data Flow

```
Browser → Next.js API Route (/api/...) → AniKotoAPI (anikototvapi.vercel.app)
```

Two paths for data fetching:

1. **Server-side** (pages): `src/services/aniforge.ts` → `fetchWithRetry()` → unwraps `.results` → `src/lib/hianime.ts` mappers → component
2. **Client-side** (interactive): `src/services/client-proxy.ts` → `/api/proxy/[...slugs]` → AniKotoAPI → unwraps `.results` → client

### Key Files

| File | Purpose |
|------|---------|
| `src/services/aniforge.ts` | All AniKotoAPI endpoints, `fetchWithRetry` with auto `.results` unwrap |
| `src/lib/hianime.ts` | Data mappers, field name remapping, `getHomeData` orchestration |
| `src/app/api/proxy/[...slugs]/route.ts` | Generic CORS proxy, unwraps `.results` |
| `src/services/client-proxy.ts` | Client-side proxy wrappers, stubs for missing endpoints |
| `src/app/api/schedule/route.ts` | Custom schedule route (API `/schedule` returns empty) |
| `src/app/anime/watch/video-player-section.tsx` | Video player with server/stream flow |

## AniKotoAPI Integration

**Base URL:** `https://anikototvapi.vercel.app/api`

**Response format:**
```json
{ "success": true, "results": <data> }
```

The `.results` field is unwrapped automatically by:
- `fetchWithRetry()` in `aniforge.ts`
- The proxy route in `/api/proxy/[...slugs]`

Consumers receive `<data>` directly.

### Field Names (vs Kryzox)

| Kryzox | AniKotoAPI | Notes |
|--------|------------|-------|
| `titles.english` | `title` | Direct string |
| `titles.romaji` | `japaneseTitle` | Direct string |
| `images.poster` | `poster` | Direct string URL |
| `type.name` | `type` | String ("TV", "ONA") |
| `status` | `status` | String ("Currently Airing") |
| `genres[]` | `genres` | **Comma-separated string**, not array |
| `description` | `synopsis` | Different field name |
| `studios[]` | `studios` | **String**, not array |
| `producers[]` | `producers` | **String**, not array |
| `episodes` | `episodes` | **String** ("1122" or "?") |
| `malScore` | `malScore` | String like "8.73" |

### Available Endpoints

| Endpoint | Response Shape | Notes |
|----------|---------------|-------|
| `GET /` | `{ spotlights, trending, topAiring, genres }` | Home page |
| `GET /info?id={slug}` | Single anime details | Genres/studios/producers are strings |
| `GET /episodes/{slug}` | `{ totalEpisodes, episodes: [...] }` | NOT a direct array |
| `GET /search?keyword={}&page={}` | `{ totalPages, data: [...] }` | Uses `keyword` param |
| `GET /search/suggest?keyword={}` | Array of suggestions | |
| `GET /genre/{name}?page={}` | `{ totalPages, data: [...] }` | |
| `GET /az-list/{letter}?page={}` | `{ totalPages, data: [...] }` | |
| `GET /type/{movie,tv,ova,ona}?page={}` | `{ totalPages, data: [...] }` | |
| `GET /trending` | Array (no pagination) | |
| `GET /most-popular?page={}` | `{ totalPages, data: [...] }` | |
| `GET /newly-added?page={}` | Recently added | |
| `GET /new-release?page={}` | Recently updated | |
| `GET /top-ten` | `{ today, week, month }` | |
| `GET /random` | Single anime | |
| `GET /status/currently-airing?page={}` | `{ totalPages, data: [...] }` | ~450 anime across 15 pages |
| `GET /filter?keyword=&type=&status=&season=&sort=&genres=` | Filtered results | |
| `GET /servers?ids={encrypted}` | Server list | See streaming flow |
| `GET /stream?id={link_id}` | `{ url, skipData }` | See streaming flow |

### Unavailable Endpoints (stubbed with empty data)

- Characters (no `/characters`)
- People / Staff (no `/people`)
- Series (no `/series`)
- Schedule data (see below)

## Schedule Implementation

The AniKotoAPI `/schedule?date=X` endpoint returns empty arrays for all dates. The site uses a workaround:

1. **API Route** `src/app/api/schedule/route.ts` fetches ALL pages of `GET /status/currently-airing` (~450 anime, 15 pages fetched in parallel)
2. Distributes items across 7 days using a deterministic hash of the anime slug
3. Accepts optional `?date=MM/DD/YYYY` param — when provided, filters to only that day's items
4. Returns `{ data: { scheduledAnimes: [...] } }` format

**Consumers:**
- **Homepage** `src/components/anime-schedule.tsx`: Uses `useGetAnimeSchedule(date)` React Query hook, passes a date string, expects `scheduledAnimes` array with `name`, `id`, `episode`, `airingTimestamp` fields
- **/schedule page** `src/app/schedule/page.tsx`: Uses `proxyScheduleService.getSchedules()`, groups by `airingDay`/`day`, expects items with `title`, `episode`, `type`, `slug`, `time` fields

## Watch Page / Streaming Flow

The video player (`src/app/anime/watch/video-player-section.tsx`) uses a 3-step flow:

1. **Get servers:** `GET /api/proxy/servers?ids={encrypted_server_ids}` → returns `[{ type: "sub"|"dub"|"hsub", link_id: "...", name: "...", ep_id: "..." }]`
2. **Select server:** The player picks the first server matching the preferred language (sub/dub), falling back to the first available
3. **Get stream URL:** `GET /api/proxy/stream?id={link_id}` → returns `{ url: "https://vidtube.site/stream/...", skipData: { intro: [0,0], outro: [0,0] } }`

**Server names:** VidPlay-1, HD-1, Vidstream-2, VidCloud-1  
**Server types:** `"sub"`, `"dub"`, `"hsub"` (hard-subbed)

The stream URL is a web-based video player page (vidtube.site). The player renders it in an iframe. A direct "Open" link is provided as fallback.

All streaming API calls go through the CORS proxy (client-side → `/api/proxy/...` → AniKotoAPI).

### Episode Data

The episodes endpoint returns:
```json
{
  "totalEpisodes": 1122,
  "episodes": [
    { "title": "1", "episode_no": "1", "server_ids": "<encrypted>", "date": "1999-10-20" }
  ]
}
```

Note: `.results` is `{ totalEpisodes, episodes: [...] }` — NOT a direct array. The `hianime.ts` mapper unwraps this correctly.

## Important Gotchas

### AnimeCard sub/dub display
```tsx
// WRONG — renders literal "0" when sub is 0
{props.sub && <Badge>Sub {props.sub}</Badge>}
// CORRECT — checks for null/undefined
{props.sub != null && <Badge>Sub {props.sub}</Badge>}
```

### AnimeSections empty state
The component returns `null` when `trendingAnime` is empty to prevent rendering blank sections.

### Slug format
AniKotoAPI slugs include episode suffix: `"one-piece-odmau/ep-1"`. Extract the anime slug with:
```ts
slug.split("/")[0] // → "one-piece-odmau"
```

### Home page data
`getHomeData` makes 7 parallel API calls to populate all sections (reduced from 12 to avoid rate limits):
- `/` (spotlights, trending, topAiring, genres)
- `/most-popular?page=1` (top anime)
- `/most-popular?page=2` (most favorite)
- `/newly-added?page=1` (latest episodes)
- `/new-release?page=1` (latest completed)
- `/type/movie?page=1` (movies)
- `/top-ten` (top 10)

### Genres/Studios are strings
```ts
// AniKotoAPI returns strings, not arrays
item.genres = "Action, Adventure, Fantasy" // NOT ["Action", "Adventure", "Fantasy"]
item.studios = "Toei Animation" // NOT ["Toei Animation"]
```

### Episodes count is a string
```ts
item.episodes = "1122" // NOT 1122 (number)
item.episodes = "?" // for ongoing anime
```

## Deployment

```bash
npm run build
npm start
```

### Vercel
1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — no config required
4. (Optional) Add custom domain

## Support

topupieanime@gmail.com
