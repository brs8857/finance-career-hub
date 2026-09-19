# Design

Architecture and the decisions behind it. Agreed with the owner on 2026-09-19.

## Goals

A local-first personal site for a UK student preparing for finance / accounting /
economics applications. Centrepiece: a market tracker. Around it: macro panel,
commercial-awareness notes, application tracker, flashcards, pathways guide.

Non-goals: multi-user, public hosting, trading, recommendations.

## Architecture

```
Browser (React client components)
   │  fetch /api/*
   ▼
Next.js route handlers  (src/app/api/**/route.ts)   ← only place secrets are read
   │
   ├─ src/lib/markets   provider adapters ─┬─ yahoo.ts       (default, keyless)
   │                                       ├─ twelvedata.ts  (optional, keyed)
   │                                       └─ sample.ts      (labelled demo data)
   ├─ src/lib/macro     fred.ts · ons.ts · boe.ts
   ├─ src/lib/news      RSS parsing
   ├─ src/lib/cache.ts  TTL cache: memory → .cache/*.json → upstream
   └─ src/lib/store     JSON-file repository → data/*.json
```

### Provenance on every payload

Every data response carries:

```ts
{ source: "yahoo" | "twelvedata" | "boe" | "ons" | "fred" | "sample",
  fetchedAt: string /* ISO */, isSample: boolean, ...data }
```

The UI renders "Last updated" and the SAMPLE badge **only** from these fields.

### Caching

`cached(key, ttlSeconds, loader)`:
1. Return the in-memory entry if fresh.
2. Else return the `.cache/<key>.json` entry if fresh (survives dev-server restarts).
3. Else call the loader, store the result in both.
4. If the loader throws and a **stale** entry exists, serve it marked `stale: true`
   (the UI says "showing last known data from …"). Otherwise the caller falls back to
   sample mode.

Default TTLs: quotes 5 min, intraday history 5 min, daily history 1 hour,
macro 12 hours, news 30 minutes.

Upstream calls to Yahoo go through a single-lane throttle (one request at a time,
≥ 500 ms apart) because bursts trigger blocking.

### Persistence

`src/lib/store` exposes typed collections (watchlist, instrument notes, news notes,
applications, flashcard progress, goals). Server side it reads/writes
`data/<collection>.json` with atomic writes (write temp file, then rename).
Client side a `useCollection()` hook talks to `/api/store/<collection>`.

## Data sources (checked 2026-09-19)

| Provider | Free limits | Coverage on free tier | Decision |
|---|---|---|---|
| Alpha Vantage | 25 req/day, 5/min | Global, but quota is tiny | Rejected - two page loads would exhaust it |
| Finnhub | 60 req/min | Real-time quotes US-only; non-commercial licence | Rejected - no FTSE/DAX/Nikkei |
| Twelve Data | 800 credits/day, 8/min | US stocks/ETFs, FX, crypto; international is paid | **Optional provider** |
| Yahoo chart endpoint | Unpublished; bursts get blocked | Everything incl. ^FTSE, ^FTMC, ^GDAXI, ^N225, BZ=F, GC=F, LSE stocks | **Default provider** (personal use) |
| Bank of England IADB | Keyless CSV | Bank Rate, gilt yields | **Used** |
| ONS time-series API | Keyless JSON | UK CPI, GDP, labour market | **Used** |
| FRED | Free key, generous | US macro + yield curve | **Used (Phase 2)** |
| Frankfurter (ECB) | Keyless | Daily reference FX rates | Candidate FX fallback |
| Stooq | - | Returned 404 from this machine | Rejected |

Live tests on 2026-09-19: Yahoo returned `^FTSE`, `^GSPC`, `GBPUSD=X` (HTTP 200) when
spaced out, but 11 rapid requests all returned 404. BoE IADB and ONS returned data.
Frankfurter returned GBP→USD 1.3344 for 2026-09-18.

### Yahoo findings (2026-09-19)

Checked against live responses before relying on them:

- `/v8/finance/spark?symbols=A,B,C` returns every symbol in one request with
  `previousClose`, so the dashboard needs one upstream call.
- The last regular-session close matched `regularMarketPrice` for all 17 default
  symbols. `fulldayPrice` did **not** for AAPL (334.80 vs 336.13 - extended hours),
  so price and change are both derived from the series + `previousClose`.
- Daily bars can disagree with `previousClose` (FTSE 100 bars implied 10,816.1;
  Yahoo's published change used 10,688.5). Daily change never uses bars.
- Unknown tickers: 404 **with** `chart.error.description` "No data found...".
  Rate limiting: 404/429 **without** it. Treated differently.

## Instruments (Phase 1)

| Group | Instruments (Yahoo symbol) |
|---|---|
| Indices | FTSE 100 (^FTSE), FTSE 250 (^FTMC), S&P 500 (^GSPC), Nasdaq Composite (^IXIC), DAX (^GDAXI), Nikkei 225 (^N225) |
| FX | GBP/USD (GBPUSD=X), GBP/EUR (GBPEUR=X), USD/JPY (JPY=X) |
| Commodities | Brent crude (BZ=F), Gold (GC=F) |
| Rates | UK 10-year gilt yield (Bank of England IADB, daily) |
| Watchlist | User-editable; defaults are a handful of well-known FTSE/US names |

## Macro sources (checked 2026-09-19)

| Indicator | UK | US |
|---|---|---|
| Policy rate | BoE IUDBEDR (daily) | FRED DFEDTARL/DFEDTARU |
| CPI | ONS D7G7 / MM23 | FRED CPIAUCSL, units=pc1 |
| GDP | ONS IHYQ + IHYR, PN2 or QNA (newer wins) | FRED A191RL1Q225SBEA + A191RO1Q156NBEA |
| Unemployment | ONS MGSX / LMS | FRED UNRATE |
| Yield curve | BoE IUDSOIA, IUDSNPY, IUDMNPY, IUDLNPY | US Treasury daily par yield CSV |

On 2026-09-19 QNA's latest GDP quarter was Q1 2026 while PN2 already had Q2 2026,
which is why both are read.

## UI

Calm "Bloomberg-lite": neutral slate surfaces, one accent colour, green/red only for
price direction (paired with ▲/▼ glyphs so colour isn't the only signal), tabular
numerals, generous spacing. Sidebar nav on desktop, slide-over on mobile. Light/dark
theme following the OS, with a manual toggle.

## Testing

Vitest for pure logic: provider response parsing, change/percent calculations, cache
behaviour, Leitner scheduling, deadline countdowns. Each phase ends with a manual run
of the app in a browser.
