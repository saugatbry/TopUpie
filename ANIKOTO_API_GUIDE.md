# AniKotoTV API Integration Guide

Base URL: `https://anikotoapi-ruby.vercel.app/api

All endpoints return JSON in the format:
```json
{ "success": true, "results": <data> }
```

---

## 1. Home Page

**Endpoint:** `GET /`

**Response shape:**
```json
{
  "success": true,
  "results": {
    "spotlights": [{ "slug", "poster", "title", "japaneseTitle", "description", "rating", "quality", "sub", "dub", "date" }],
    "trending": [{ "slug", "poster", "title", "japaneseTitle", "sub", "dub", "total", "type" }],
    "topAiring": [{ "slug", "poster", "title", "japaneseTitle", "sub", "dub", "total", "type" }],
    "genres": ["Action", "Adventure", ...]
  }
}
```

**Fields:**
- `slug` (string) — unique identifier, format: `{title}-{random}/ep-{num}`. Extract anime ID with `slug.split("/")[0]`
- `title` (string) — English title
- `japaneseTitle` (string) — Japanese/Romaji title
- `poster` (string) — image URL
- `sub` (number) — sub episode count
- `dub` (number) — dub episode count

---

## 2. Anime Info / Details

**Endpoint:** `GET /info?id={slug}`

**Example:** `/info?id=one-piece-odmau`

**Response shape:**
```json
{
  "success": true,
  "results": {
    "slug": "one-piece-odmau",
    "title": "One Piece",
    "japaneseTitle": "One Piece",
    "poster": "https://...",
    "backgroundImage": "https://...",
    "type": "TV",
    "status": "Currently Airing",
    "genres": "Action, Adventure, Fantasy, Comedy, Shounen, Super Power, Drama",
    "episodes": "1122",
    "duration": "24 min",
    "premiered": "? 1999",
    "aired": "Oct 20, 1999 to ?",
    "malScore": "8.73",
    "animeId": 1642,
    "synopsis": "...",
    "studios": "Toei Animation",
    "producers": "Shueisha Funimation Fuji TV Toei Animation 4Kids Entertainment TAP",
    "altNames": "One Piece;OP ONE PIECE ...",
    "rating": "PG-13",
    "reviewCount": 0
  }
}
```

**Notes:**
- `genres` is a comma-separated **string**, not an array
- `episodes` is a **string** (`"1122"` or `"?"` for ongoing)
- `studios` is a **string**, not an array
- `producers` is a **string**, not an array

---

## 3. Episodes List

**Endpoint:** `GET /episodes/{slug}`

**Example:** `/episodes/one-piece-odmau`

**Response shape:**
```json
{
  "success": true,
  "results": {
    "totalEpisodes": 1122,
    "episodes": [
      {
        "title": "1",
        "episode_no": "1",
        "server_ids": "<encrypted string>",
        "date": "1999-10-20"
      }
    ]
  }
}
```

**Notes:**
- `server_ids` is an encrypted string. Pass it to the servers endpoint to get stream links.
- The results object has `totalEpisodes` + `episodes` array (NOT a direct array).

---

## 4. Search

**Endpoint:** `GET /search?keyword={query}&page={page}`

**Example:** `/search?keyword=naruto&page=1`

**Response shape:**
```json
{
  "success": true,
  "results": {
    "totalPages": 5,
    "data": [
      {
        "slug": "naruto-shippuden-12345/ep-1",
        "title": "Naruto Shippuden",
        "japaneseTitle": "Naruto Shippuuden",
        "poster": "https://...",
        "sub": 500,
        "dub": 500,
        "total": 500,
        "type": "TV",
        "rating": "8.27"
      }
    ]
  }
}
```

**Search Suggestions:** `GET /search/suggest?keyword={query}`

---

## 5. Browse by Genre

**Endpoint:** `GET /genre/{name}?page={page}`

**Example:** `/genre/action?page=1`

**Response shape:**
```json
{
  "success": true,
  "results": {
    "totalPages": 114,
    "data": [
      {
        "slug": "dandadan-lzcmw/ep-1",
        "animeId": "4",
        "poster": "https://...",
        "title": "Dandadan",
        "japaneseTitle": "...",
        "sub": 12,
        "dub": 12,
        "total": 12,
        "type": "TV",
        "rating": "6.23"
      }
    ]
  }
}
```

---

## 6. Browse by Type

**Endpoints:**
- `GET /type/movie?page={page}`
- `GET /type/tv?page={page}`
- `GET /type/ova?page={page}`
- `GET /type/ona?page={page}`
- `GET /type/special?page={page}`

All return the same shape as genre: `{ totalPages, data: [...] }`

---

## 7. A-Z List

**Endpoint:** `GET /az-list/{letter}?page=1`

**Example:** `/az-list/a?page=1`

Returns the same `{ totalPages, data: [...] }` shape as genre.

---

## 8. Most Popular / Trending

**Endpoints:**
- `GET /trending` — returns array directly (no pagination)
- `GET /most-popular?page={page}` — returns `{ totalPages, data: [...] }`
- `GET /newly-added?page={page}` — recently added anime
- `GET /new-release?page={page}` — recently updated episodes

---

## 9. Top 10

**Endpoint:** `GET /top-ten`

**Response:**
```json
{
  "success": true,
  "results": {
    "today": [{ "slug", "poster", "title", "japaneseTitle", "sub", "dub", "type", "rating" }],
    "week": [...],
    "month": [...]
  }
}
```

---

## 10. Schedule

**Endpoint:** `GET /schedule?date={MM/DD/YYYY}`

**Example:** `/schedule?date=06/20/2026`

Returns array of scheduled anime with `title`, `slug`, `time`, `episode`, `type`, and `airingDay`.

---

## 11. Random Anime

**Endpoint:** `GET /random`

Returns a single random anime in the same shape as trending items.

---

## 12. Filter

**Endpoint:** `GET /filter?keyword={}&type={}&status={}&season={}&language={}&sort={}&genres={}`

---

## 13. Video Streaming

### Step 1: Get Servers
**Endpoint:** `GET /servers?ids={server_ids}`

**Example:** `/servers?ids=<encrypted string from episodes>`

**Response:**
```json
[
  {
    "type": "sub",
    "ep_id": "30298",
    "link_id": "<encrypted link id>",
    "name": "VidPlay-1"
  },
  {
    "type": "sub",
    "ep_id": "30298",
    "link_id": "<encrypted link id>",
    "name": "HD-1"
  }
]
```

**Available servers:** VidPlay-1, HD-1, Vidstream-2, VidCloud-1
**Server types:** `"sub"`, `"dub"`, `"hsub"` (hard-subbed)

### Step 2: Get Stream URL
**Endpoint:** `GET /stream?id={link_id}`

**Example:** `/stream?id=<link_id from server>`

**Response:**
```json
{
  "linkId": "...",
  "url": "https://vidtube.site/stream/<hash>/sub",
  "skipData": { "intro": [0, 0], "outro": [0, 0] }
}
```

The `url` is a web-based video player page. Embed in an `<iframe>` or open directly.

---

## Quick Integration Snippet (JavaScript/TypeScript)

```typescript
const API = "https://anikototvapi.vercel.app/api";

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  const json = await res.json();
  if (!json.success) throw new Error("API error");
  return json.results as T;
}

// Home
const home = await fetchAPI("/");
// home.spotlights, home.trending, home.topAiring, home.genres

// Info
const info = await fetchAPI("/info?id=one-piece-odmau");
// info.title, info.poster, info.genres (string), info.status, etc.

// Episodes
const eps = await fetchAPI("/episodes/one-piece-odmau");
// eps.totalEpisodes, eps.episodes[0].server_ids

// Search
const search = await fetchAPI("/search?keyword=naruto&page=1");
// search.totalPages, search.data[0].title

// Streaming
const servers = await fetchAPI("/servers?ids=<encrypted_ids>");
const stream = await fetchAPI(`/stream?id=${servers[0].link_id}`);
// stream.url -> embed in iframe
```

## Important Notes

1. **Always unwrap `.results`** from the response `{ success, results }`
2. **Slugs** are in format `{anime-id}/ep-{num}` — use `slug.split("/")[0]` to get the anime identifier
3. **Episode response** has `results = { totalEpisodes, episodes: [...] }` — not a direct array
4. **Genres** and **studios** are strings, not arrays — parse with `.split(", ")` if needed
5. **No characters/people/series endpoints** — those features are not available
6. **Server IDs are encrypted** — pass them as-is to `/servers?ids=`
7. **Stream URLs** are web video players (e.g., vidtube.site) — use `<iframe>` for embedding
8. **CORS:** The API supports CORS, but for production you may want a proxy route
