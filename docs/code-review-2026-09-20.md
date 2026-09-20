# finance-career-hub — Code Review (2026-09-20)

Baseline: `main` @ `3e2d3ba` (10 commits, all 2026-09-19). Line numbers refer to the file
named in each finding. This is the first review of this repo.

Each finding is tagged **Verified (sim)** — reproduced by running the code: the dev server's
own API routes, a direct query to the upstream provider, a throw-away Vitest file against the
real functions, or the page in a Chromium browser; **Verified (reading)** — confirmed from the
source alone; or **Speculation**.

How the review was done: every file under `src/` was read (~10,100 lines, 22 test files);
`npm run lint`, `npm test` (101 tests) and `npm run build` were run from a clean clone on
Node 24.18; `/api/markets/quotes`, `/api/macro`, `/api/news` and `/api/store/*` were exercised
with curl against the running dev server; Yahoo's spark and chart endpoints were queried
directly; pure functions were driven from a temporary Vitest file; every page was loaded in
Chromium at desktop width with axe-core 4.10.3 (WCAG 2.0/2.1 A+AA + best-practice) and again
at 375 px; theme-token contrast was computed with the WCAG 2 formula; every external URL the
app links to or fetches was requested; and the full git history was scanned for key-shaped
strings.

## 1. Overview and what's good

**Shape.** A Next.js 16 App Router app with a clean three-layer split: route handlers under
`src/app/api/**` are the only place secrets are read; `src/lib/**` holds provider adapters,
caching, parsing and pure domain logic; `src/components/**` is client-side React talking to
`/api/*`. Persistence is nine zod-validated JSON collections in `data/`, served by one
generic route and one generic hook. The eight "non-negotiable rules" in `CLAUDE.md` are
largely honoured by construction, not by discipline — that is the best thing about the code.

Things that are genuinely good and worth keeping as they are:

- **Provenance is structural.** Every payload the browser receives extends `Provenance`
  (`src/lib/markets/types.ts:52`), and `DataStatus` / `SampleBadge` render only from those
  fields. `service.fallback.test.ts` pins the "never invent data" guarantee under provider
  failure, silent omission, stale cache and sample mode.
- **Secrets can't leak by accident.** `process.env` is read in exactly one file
  (`src/lib/env.ts`), which imports `"server-only"`, so a client import is a build error.
  Verified (sim): grep, plus a full-history scan found no key-shaped strings and only
  `.env.example` and `data/.gitkeep` ever committed under `.env*` / `data/`.
- **The cache is right.** `src/lib/cache.ts` de-duplicates in-flight loads, survives restarts
  via `.cache/`, and serves a stale copy flagged `stale: true` when the loader throws. The
  inflight check sits synchronously after the awaited read, so the concurrency test is not a
  fluke.
- **Atomic writes with a Windows retry** (`src/lib/store/server.ts:38`), serialised per
  collection, and hand-edited files that fail validation are refused rather than discarded.
- **Accessibility claims hold up.** Verified (sim): all 34 text/background token pairs across
  both themes are ≥ 5.0:1 (lowest: light `--up` on `--surface-2`, 5.02:1); no horizontal
  overflow on any page at 375 px; axe reports zero violations on 8 of 10 pages, and the only
  rule failing on the other two is a real but small one (§2.9). Direction is never colour-only
  (`Delta` pairs colour with ▲/▼ and sr-only text).
- **Every outbound link and feed resolves** (18 pathway/source URLs, 7 macro source links,
  7 RSS feeds → HTTP 200; FRED refuses curl but loads in a browser). Verified (sim).
- `npm audit`: 0 vulnerabilities. Lint, tests and production build are clean.

The findings below are therefore mostly about the edges the design didn't reach, not about
the design.

## 2. Findings

Ordered by how much they matter. Each ends with a concrete fix.

### 2.1 The personal data store is readable and writable by anyone on the same network — Verified (sim)

`next dev` (and `next start`) bind to all interfaces: `netstat` shows `0.0.0.0:3000` and
`[::]:3000` listening, and `GET http://192.168.1.203:3000/api/store/applications` from the LAN
address returns 200 with the collection. `/api/store/[collection]` (`src/app/api/store/[collection]/route.ts`)
has no authentication, and `PUT` replaces the whole collection. So on any shared network —
halls, a university campus, a café — every device can read the application tracker (employers,
stage, notes, **contacts' names and email addresses**), the news notes and the flashcard
progress, and can overwrite them.

API keys are not exposed this way (they never leave the server), and the app is described as
local-only, but "local" currently means "this network", not "this machine". `CLAUDE.md` rule 8
covers the GitHub side of privacy; this is the runtime side.

**Fix:** bind to loopback in `package.json`: `"dev": "next dev -H 127.0.0.1"` and
`"start": "next start -H 127.0.0.1"`. If phone access on the home network is wanted later,
that is the moment to add a shared-secret header or a login, not before.

### 2.2 Commodities fall to sample data whenever the market is closed — Verified (sim)

On Sunday 20 Sep, `/api/markets/quotes` returned Brent (`BZ=F`) and Gold (`GC=F`) as
`source: "sample", isSample: true` with the note *"Yahoo Finance returned no data for this
symbol"*. The symbols are fine; the market was shut. A direct query to Yahoo's spark endpoint
at the same moment gave, for `BZ=F`: `timestamps=0 closes=0 previousClose=99.93 fulldayPrice=99.29`,
and the chart endpoint's `meta.regularMarketPrice` was `99.29` (Friday's close). So Yahoo *did*
have a real last price; `parseSparkEntry` (`src/lib/markets/providers/yahoo.ts:88`) returns
`null` because there are no intraday bars in the 1-day window, `getQuotes` in
`src/lib/markets/service.ts:137` treats a missing map entry as "no data for this symbol", and
the tile shows a synthetic 98.34 under a SAMPLE badge.

Two consequences:

- With a fresh or cleared `.cache/`, futures are sample data every weekend, every exchange
  holiday, and (depending on session hours) overnight. Indices are unaffected because the
  spark window still contains Friday's session.
- With a populated cache the stale path (`service.ts:144`) kicks in instead and the tile shows
  "Last known" — but with `note: undefined`, because `failure` is null. The badge appears with
  no explanation.

Note the wording of the reason is also wrong in this case: the provider didn't return "no
data for this symbol"; it returned no *bars*.

**Fix (recommended):** when a spark entry has no bars but carries `previousClose`, fall back
to the chart endpoint for that symbol (`/v8/finance/chart/<sym>?range=5d&interval=1d`) and use
`meta.regularMarketPrice` as the price with the spark's `previousClose` as previous close —
that is the same "last regular-session close" rule the code already documents at
`yahoo.ts:83-87`, and it is one throttled call per affected symbol. Set `spark: []`, `asOf`
from `meta.regularMarketTime`, and add a note such as "Market closed; last close shown".
A cheaper stop-gap is to use `fulldayPrice` when there are no bars at all (the extended-hours
caveat only bites when there *is* a regular session in the window), but the chart fallback is
the version that stays true to the documented rule. Either way, add a spark fixture with
`timestamp: []` and `previousClose` set to `yahoo.test.ts`.

### 2.3 Sample data is not distinguishable from real data for some instruments — Verified (sim)

`src/lib/markets/providers/sample.ts:6-8` says every series is "indexed around 100, so it can't
be mistaken for a real level (the real FTSE 100 is in the thousands)". Driving `sampleQuote`
for every dashboard instrument gives prices between 97.9 and 104.7 with daily changes between
−2.1% and +4.7%. Two problems:

- Brent crude really is priced around $100: the sample tile showed **98.34** while the real
  Friday close was **99.29**. USD/JPY (real ≈ 157) and any share quoted in pence are in the
  same order of magnitude, so a ~100 reading is plausible there too. The "can't be mistaken"
  claim is false for exactly the instruments most likely to be in sample mode (§2.2).
- The synthetic changes (−2.1% on the FTSE, +4.7% on the DAX) look like real, newsworthy moves.

The SAMPLE badge is present, so rule 2 in `CLAUDE.md` is met to the letter; the comment in
`sample.ts` is what's wrong, and the risk is a student reading the number, not the badge.

**Fix:** make sample values look synthetic as well as being labelled — e.g. a flat line at
exactly `1000.00` with change `0`, or render the numbers in `text-muted` with a strikethrough
when `isSample`. If the wave shape is wanted for chart demos, keep it for `sampleHistory` only
and give `sampleQuote` implausible levels. Update the comment either way.

### 2.4 No timeouts on Yahoo, Bank of England, ONS, FRED or Twelve Data requests — Verified (reading)

Only `treasury.ts:62` (20 s) and `news/service.ts:22` (15 s) pass `AbortSignal.timeout`.
`yahoo.ts:158`, `boe.ts:76`, `ons.ts:82`, `fred.ts:57` and `twelvedata.ts:82` call `fetch` with
no signal, so a hung upstream (a black-holed connection, a stalled TLS handshake) holds the
request for Node's default socket timeout — minutes. Because the loader never *throws*, the
stale-copy and sample fallbacks in `cache.ts:90` and `service.ts:133` never engage: the Markets
page just sits on "Loading prices…", and since every quote request goes through one
single-lane throttle (`yahoo.ts:23`), every later request queues behind the hung one.

**Fix:** one helper, `fetchWithTimeout(url, init, ms = 10_000)`, that adds
`signal: AbortSignal.timeout(ms)`, used by all seven fetch sites. The throttle already tolerates
rejections.

### 2.5 News feeds are fetched one after another, contradicting the comment — Verified (reading)

`src/lib/news/service.ts:10` says "One slow or broken feed never blocks the others". The loop at
`:38` is `for … await`, and `fetchFeed` runs inside a single-lane throttle (`:15`), so the
seven feeds are strictly sequential: a feed that takes its full 15 s timeout delays every feed
after it, and the worst case for `/api/news` on a cold cache is 7 × 15 s. (Warm-cache timing
is 8–27 ms, so this only bites when the 30-minute TTL expires.)

**Fix:** the seven feeds are on seven different hosts, so the shared throttle buys nothing.
Drop it (or make it per-host) and fetch with `Promise.allSettled(FEEDS.map(...))`; the
per-feed `cached()` and error handling already isolate failures.

### 2.6 Macro loads eight indicators and two curves strictly in series — Verified (sim)

`getMacro` (`src/lib/macro/service.ts:279`) awaits each definition in turn "on purpose: each
source has its own throttle". Measured cold with no FRED key: **4.1 s** for `/api/macro`
(BoE ×2, ONS ×6, Treasury ×1). With a key it is ~15 upstream calls. Because each source *does*
have its own throttle, running the definitions with `Promise.all` would still serialise
within a source while overlapping BoE, ONS, FRED and Treasury — wall-clock drops to the
slowest source. Combined with §2.4, today one stalled ONS call blanks the whole Macro page.

**Fix:** `await Promise.all(DEFINITIONS.map(loadIndicator))` and `Promise.all([ukCurve(), usCurve()])`.
Each loader already catches and returns `unavailable`, so nothing else changes.

### 2.7 Whole-collection saves are last-writer-wins, and a second tab never refreshes — Verified (sim)

`useCollection.save` (`src/lib/store/useCollection.ts:58`) PUTs the entire collection from
the tab's own snapshot. Reproduced with curl: client A saved `notesPerWeek: 7`; client B, still
holding the original copy, saved `cardsPerWeek: 99`; the server ended with `notesPerWeek: 5,
cardsPerWeek: 99` — A's change silently gone. In the app this is two tabs (Kanban in one,
study session in another), or a laptop and a phone once §2.1 is relaxed. It is made worse by
the fact that nothing ever re-fetches: `reload` is exported but has no callers (grep), and
there is no refetch on focus, so tab B shows stale data until a hard refresh, then overwrites
with it on its next edit.

**Fix (small):** version each collection. Store `{ version, value }` in the file; `GET`
returns the version; `PUT` requires it and returns 409 on mismatch; the hook reloads and
re-applies the updater on 409. About thirty lines across `server.ts`, `route.ts` and
`useCollection.ts`. Also refetch on `visibilitychange` so a second tab converges.

### 2.8 Element ids containing spaces break the `aria-labelledby` relationships — Verified (sim)

`HeadlineFeed.tsx:113-114` uses `id={`day-${group.label}`}` with labels like "Fri 18 Sept";
`pathways/page.tsx:167-168` uses `id={`cat-${category}`}` with "Banking & investment". The DOM
on `/news` contains ids `day-Fri 18 Sept` etc. `aria-labelledby` is a space-separated id list,
so `aria-labelledby="day-Fri 18 Sept"` looks for three elements and finds none — the sections
have no accessible name, which is the thing those attributes were added to provide. (axe
doesn't flag it because it only validates the *attribute*, not the resolution.)

**Fix:** slugify (`label.toLowerCase().replace(/[^a-z0-9]+/g, "-")`) or use `useId()`, or
just `aria-label={group.label}` on the section.

### 2.9 Inline links are distinguished by colour alone (WCAG 1.4.1) — Verified (sim)

axe `link-in-text-block` (serious) on `/macro` (the two "ONS D7G7…" style source links inside
the muted text block, `IndicatorCard.tsx:111`) and `/pathways` (the three links in "Whichever
route you choose", `page.tsx:181-188`). They are `text-accent hover:underline`, so a reader
who can't see the blue has no cue until hover. Standalone links ("Markets →") are fine.

**Fix:** `underline underline-offset-2` (or `decoration-accent/50`) on links that sit inside
running text. A `LinkInline` helper would stop it recurring.

### 2.10 A new flashcard answered correctly ends up in the same place as one answered wrongly — Verified (sim)

`review(undefined, true, today)` → `{ box: 1, due: +1 day }`; `review(undefined, false, today)`
→ `{ box: 1, due: +1 day, lapses: 1 }`. `leitner.ts:27` starts new cards "before box 1" so the
first correct answer lands in box 1, not 2. That is a legitimate design, but the page copy
contradicts it: `DeckOverview.tsx:216` says "every card starts in box 1. Get it right and it
moves up a box", and `StudySession.tsx:121` says "the ones you knew are spaced further out" —
for first-time cards they aren't; they come back tomorrow either way. `leitner.test.ts:8`
asserts the current behaviour, so it is intended; only the copy is wrong — unless the intent
was the classic scheme (first correct → box 2, 3 days), in which case the code is.

**Fix:** decide which. If the code is right, change the two sentences. If the copy is right,
`const currentBox = previous?.box ?? 1` and update the test.

### 2.11 Smaller correctness points — all Verified (sim) unless noted

- **All-zero goals give a 104-week streak.** `GoalsSchema` allows 0 for each goal; with all
  three at 0 and no activity, `weeklyStreak` returns its `maxWeeks` cap of 104. Treat "no
  goals set" as no streak, or make the minimum 1.
- **"Applications progressed" counts a backwards-then-forwards move.** History
  applied → researching → applying within one week counts as progress (`goals.ts:52` compares
  with the previous step, not the furthest stage reached). Compare against the running maximum.
- **Atom feeds: an `<link rel="enclosure">` listed before the article link wins.**
  `rss.ts:84` takes the first link with an `href`. Prefer `rel="alternate"` or no `rel`.
- **Tracking parameters `fbclid`, `gclid`, `mc_cid`/`mc_eid` survive `canonicalUrl`**
  (`rss.ts:37`). Only `utm_*`, `at_*`, `CMP`, `cmpid`, `ref`, `ns_*` are stripped. Extend the
  list; it affects de-duplication too, since ids are hashed from the URL.
- **`parseTdSeries` throws a `TypeError`** if a row lacks `datetime` (`twelvedata.ts:112`); the
  service turns it into a sample tile whose note reads "Cannot read properties of undefined".
  Guard the field. (Twelve Data is documented as untested — this is in that bucket.)
- **Twelve Data rate-limit errors are reported as "returned no data for this symbol"**
  — Verified (reading). `twelvedata.ts:150` swallows every per-symbol error except a missing
  key, so `failure` stays null in the service and the wrong reason is shown. Rethrow on
  HTTP 429 / "run out of API credits".
- **`PUT /api/store/<c>` with body `null` → 500** "Cannot read properties of null (reading
  'value')". Should be 400; `body?.value` and a null check fix it.
- **`IndicatorCard` will throw on an empty series** — Verified (reading). `obs.at(-1)!` and
  `obs[0].label` (`IndicatorCard.tsx:60, 98`) assume ≥ 1 observation after `since()`. Every
  current loader throws earlier on empty data, so it can't happen today; it will the first time
  a `HISTORY_START` filter empties a short series. Return the "unavailable" card instead.
- **"Check for updates" doesn't** — Verified (reading). `useQuotes.refresh` re-requests
  `/api/markets/quotes`, which serves the 5-minute server cache, so within 5 minutes the
  button spins and returns identical data. Either say "Prices refresh every 5 minutes" and
  drop the button, or accept `?fresh=1` in the route to bypass the memory/file cache (the
  throttle still protects Yahoo).

### 2.12 Nits — Verified (reading)

- `rss.ts:11-12`: the comment says `processEntities: true` stops runaway entity expansion; the
  option *enables* entity processing. The real guard is the 2 MB body cap in `news/service.ts:13`.
  Fix the comment.
- `search.ts:9`: the diacritic-stripping regex is written with literal invisible combining
  characters. `/[̀-ͯ]/g` is the same thing and survives an editor.
- `service.ts:107`: the gilt is awaited *before* the provider batch, so a slow BoE call delays
  every quotes response on a cold cache. `Promise.all` the two.
- `format.ts:74`: yield changes under 0.05 bp render as "+0.0bp". Round before choosing the sign.
- `ThemeScript.tsx:10`: the `text/javascript` / `text/plain` switch guards against something
  React 19 doesn't do (re-executing inline scripts on hydration). Harmless; can go.
- `service.fallback.test.ts:16` creates a temp directory per run and never removes it;
  `cache.test.ts` shows the `afterEach` pattern.
- `README.md` §1 says `npm run build` is a "type check" — true, and worth keeping — but
  `next.config.ts` is empty, so nothing stops a future `typescript.ignoreBuildErrors`. Not a
  bug; a note.

## 3. Test coverage

101 tests in 22 files, all pure logic, all in a Node environment. What is covered is covered
well — the Yahoo fixtures are real payloads with the dates they were taken, the cache tests use
fake timers correctly, and the fallback tests are the ones that matter most.

Not covered at all:

- `src/lib/store/server.ts` — the atomic write, the Windows rename retry, the refusal to load a
  malformed file. These protect the user's only copy of their data.
- The route handlers (`src/app/api/**`) — symbol validation, the 60-symbol cap, the `null`-body
  case in §2.11.
- `src/lib/macro/service.ts` and `src/lib/news/service.ts` orchestration (sequencing, stale
  flags, "unavailable" reasons).
- `sample.ts` — nothing asserts that sample values are distinguishable (§2.3).
- Every component. The a11y and 375 px claims in `docs/PROGRESS.md` were verified by hand;
  a jsdom project in `vitest.config.ts` with a handful of `@testing-library/react` tests for
  `useCollection`, `Delta` and `DataStatus` would make them regression-safe.

## 4. Not assessed: domain content

This review is engineering only. The following are factual claims that need someone who
knows the subject to sign off, and are outside its scope:

- `src/lib/macro/explainers.ts` — MPC/FOMC meeting counts, the 1 pp open-letter rule, PCE vs
  CPI, the mini-budget account, the ILO definition.
- `src/content/decks/*.ts` — 60 seeded flashcards.
- `src/content/pathways.ts` — exam counts, experience requirements, GES criteria (the file's
  own header records these were checked against official pages on 2026-09-19).
- `IndicatorCard.tsx:10-19` `HEADLINE_LABEL` wording, and whether Yahoo's `previousClose` for
  LSE symbols is consistently in pence.

## 5. Suggested order

1. §2.1 loopback binding — a two-line change; do it first.
2. §2.4 timeouts and §2.2 the closed-market fallback — together they make the Markets page
   honest at weekends and resilient to a bad upstream.
3. §2.3 sample-value plausibility, since it changes what §2.2 shows when it *does* fall back.
4. §2.7 versioned saves — before anything makes multi-device use easier.
5. §2.5 / §2.6 concurrency in news and macro.
6. §2.8, §2.9 — small a11y fixes; §2.10 copy decision.
7. §2.11 and §2.12 as time allows; §3 tests around the store.

Everything here was found on a clean clone with no API keys, on a Sunday. It would be worth a
second pass on a weekday with a FRED key to exercise the US macro path, and with
`MARKET_DATA_PROVIDER=twelvedata` if a key is ever obtained.
