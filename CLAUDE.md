@AGENTS.md

# Finance Career Hub

A personal website to help a UK-based student break into finance, accounting or
economics. The centrepiece is a market tracker, surrounded by tools for applications
and interview prep: macro panel, commercial-awareness notes, application tracker,
technical flashcards and a careers pathways guide.

It runs locally on the owner's machine. It is not deployed anywhere.

## Non-negotiable rules

1. **UK context by default.** GBP, FTSE, Bank of England, ONS, gilts. UK career routes:
   spring weeks, internships, graduate schemes, (degree) apprenticeships, ACA / ACCA / CIMA.
   UK spelling in all UI copy.
2. **Never invent market or economic data.** Every number on screen comes from a real
   API response. If a source is down or a key is missing, show the clearly labelled
   **sample-data mode** (amber "SAMPLE DATA" badge) - never a plausible-looking fake
   number without that label. Sample values are deliberately round/synthetic.
3. **Not financial advice.** The footer note "Educational tool, not financial advice"
   is visible on every page. Never add buy/sell recommendations.
4. **Secrets stay server-side.** API keys live in `.env.local` only, are read in server
   code (route handlers / `src/lib/**/server` modules), and are never prefixed
   `NEXT_PUBLIC_`. Never write a real key into a tracked file.
5. **Don't pre-fill the owner's personal data.** No made-up learning-log entries, no real
   employer deadlines, no fake notes. Seeded *content* (flashcards, explainers, pathways)
   is fine and must be accurate.
6. **Accessible and mobile-friendly.** Keyboard navigable, visible focus rings, WCAG AA
   contrast in both themes, works at 375px wide.
7. **Stay inside this folder.** Relative paths only. Don't touch sibling projects.
8. **Git:** repo is private. Don't change global git config. Don't deploy without asking.
   Before making the repo public, scan the full history for secrets.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | One process serves pages *and* the server routes that hide API keys |
| Language | TypeScript (strict) | Catches data-shape bugs, especially in API parsing |
| Styling | Tailwind CSS v4 | Utility classes; theme tokens in `src/app/globals.css` |
| Charts | Recharts (main charts) + hand-rolled SVG (sparklines) | |
| Persistence | JSON files in `data/` via a typed store (`src/lib/store`) | Survives browser clearing; human-readable; no native deps |
| API cache | In-memory + JSON files in `.cache/` (`src/lib/cache.ts`) | Explicit TTLs, honest "last updated" times |
| Tests | Vitest | Pure logic: parsers, calculations, spaced repetition |

Next.js 16 notes (see `node_modules/next/dist/docs/`): `params`/`searchParams` are
Promises; `middleware` is now `proxy`; `next lint` is gone (use `npm run lint`);
route handlers are **not** cached by default - we cache explicitly ourselves.

## Commands

```bash
npm install          # first time only
npm run dev          # http://localhost:3000
npm run build        # production build (also type-checks)
npm start            # serve the production build
npm run lint         # ESLint
npm test             # Vitest unit tests
npx next typegen     # regenerate route types if tsc can't find RouteContext/PageProps
```

## Folder structure

```
finance-career-hub/
├─ CLAUDE.md / AGENTS.md / README.md
├─ .env.example              # variable names + placeholders (tracked)
├─ .env.local                # real keys (gitignored - create it yourself)
├─ data/                     # your personal JSON data (gitignored)
├─ .cache/                   # cached API responses (gitignored)
├─ docs/
│  ├─ PROGRESS.md            # phase checklist + known issues
│  ├─ LEARNING-LOG.md        # owner's own observations (never auto-filled)
│  └─ DESIGN.md              # architecture + data-source decisions
└─ src/
   ├─ app/                   # routes: pages + api/ route handlers
   ├─ components/            # ui/ primitives, layout/ shell, feature folders
   ├─ lib/                   # logic: markets/, macro/, news/, store/, srs/
   └─ content/               # static seeded content: flashcard decks, pathways
```

## Coding conventions

- **Server vs client:** data fetching and anything touching `process.env` or `fs` lives in
  server code. Files that must never reach the browser import `"server-only"`.
  Client components start with `"use client"` and talk to `/api/*` routes.
- **Providers are adapters.** Every market/macro source implements a small interface and
  returns normalised types (`src/lib/markets/types.ts`). Swapping a provider = one file.
- **Every data payload carries provenance:** `source`, `fetchedAt` (ISO), `isSample`.
  The UI shows "last updated" and the SAMPLE badge from these fields - never guess.
- **Fail soft, label loudly.** A failing source degrades one panel to sample/error state;
  it never crashes the page.
- **Naming:** components `PascalCase.tsx`, logic `camelCase.ts`, one component per file.
- **Styling:** use the theme tokens (`bg-surface`, `text-muted`, `text-up`, `text-down`...)
  from `globals.css`, not raw hex colours, so dark mode keeps working.
- **Money/number formatting:** use helpers in `src/lib/format.ts` (en-GB locale).
- Keep files focused; if a file passes ~250 lines, split it.

## Data sources

| Data | Source | Key? |
|---|---|---|
| Prices, indices, FX, commodities | Yahoo Finance chart endpoint (default) | No |
| Prices (alternative) | Twelve Data free tier | `TWELVE_DATA_API_KEY` |
| UK 10y gilt yield, Bank Rate | Bank of England IADB (CSV) | No |
| UK CPI, GDP, unemployment | ONS time-series API | No |
| US macro, US yield curve | FRED | `FRED_API_KEY` |
| News headlines | Public RSS feeds (headline + link only) | No |

Yahoo rate-limits bursts hard (tested: 11 rapid calls -> all 404). Always go through
the throttled fetcher + cache, never call it in a tight loop.

Yahoo gotchas (verified against live data - see comments in `providers/yahoo.ts`):
- Use the batched `/v8/finance/spark` endpoint for quotes (one call, many symbols).
- Price = last regular-session close; change = price - `previousClose`. Never use
  `fulldayPrice` (includes US extended hours) or the last two daily bars.
- LSE shares are in pence (`GBp`). Index levels have no currency symbol.
- A 404 with body "No data found" = unknown ticker; a bare 404/429 = rate limit.

## Key files

| Task | Where |
|---|---|
| Dashboard instruments (symbols only, never prices) | `src/lib/markets/instruments.ts` |
| Fallback rules (cache -> live -> stale -> sample) | `src/lib/markets/service.ts` |
| Saved data shapes (zod) | `src/lib/store/collections.ts` |
| Theme tokens | `src/app/globals.css` |
| Sidebar links | `src/components/layout/nav.ts` |
| Provenance badges ("SAMPLE DATA", "Last known") | `src/components/ui/DataStatus.tsx` |

## Phase status

| Phase | Status |
|---|---|
| 0. Setup, Git, docs | Done |
| 1. Foundation + Markets | Done |
| 2. Macro panel | Not started |
| 3. Commercial awareness | Not started |
| 4. Application tracker | Not started |
| 5. Technical flashcards | Not started |
| 6. Pathways guide | Not started |
| Home page | Not started |

See `docs/PROGRESS.md` for dates and known issues.
