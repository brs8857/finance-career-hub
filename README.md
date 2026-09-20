# Market Tracker

A personal dashboard for breaking into UK finance, accounting and economics: a market
tracker at the centre, plus a macro panel, commercial-awareness notes, an application
tracker, technical flashcards and a careers pathways guide.

> **Educational tool, not financial advice.** Nothing here is a recommendation to buy or
> sell anything.

---

## What's inside

| Page | What it does |
|---|---|
| **Today** | Market snapshot, cards due, next deadline, daily commercial-awareness tick, weekly goals and streaks |
| **Markets** | FTSE 100/250, S&P 500, Nasdaq, DAX, Nikkei, GBP FX, Brent, gold, UK 10y gilt; charts; watchlist; "My take" notes |
| **Macro** | UK and US policy rate, CPI, GDP and unemployment, yield curves, plain-English explainers |
| **News & notes** | Business headlines from public RSS feeds; three-part notes; searchable archive |
| **Applications** | Kanban board and deadline countdowns for spring weeks, internships, grad schemes, apprenticeships |
| **Flashcards** | Spaced-repetition decks: accounting, corporate finance, economics, plus your own cards |
| **Pathways** | ACA, ACCA, CIMA, IB, S&T, asset management, economic consulting, GES, central banking |

## 1. Run it (first time)

You need [Node.js](https://nodejs.org/) 20.9 or newer (`node --version` to check).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

That's it - **it works with no API keys at all.** Market prices come from a keyless
source by default, and anything that needs a key you haven't added yet shows a clearly
labelled **SAMPLE DATA** badge instead of real numbers.

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## 2. API keys (optional)

Keys go in `.env.local` - **never** in `.env.example` or any other tracked file.
`.env.local` is gitignored. Restart `npm run dev` after editing it.

### FRED (US macro data, used from Phase 2) - recommended

1. Create a free account at <https://fredaccount.stlouisfed.org/>.
2. Go to **My Account -> API Keys -> Request API Key**, describe it as a personal
   learning project.
3. Put it in `.env.local`: `FRED_API_KEY=abc123...`

### Twelve Data (alternative price provider) - optional

1. Sign up at <https://twelvedata.com/> (free Basic plan: 800 credits/day, 8/minute).
2. Copy the key from your dashboard.
3. In `.env.local`: `TWELVE_DATA_API_KEY=...` and `MARKET_DATA_PROVIDER=twelvedata`.

The free plan is mostly US-only, so FTSE/DAX/Nikkei will show as sample data on this
provider. The default (`yahoo`) covers them.

### No key needed

Yahoo Finance chart data, Bank of England, ONS and the RSS news feeds need no keys.
Note Yahoo's endpoint is unofficial and for personal use - if it breaks, set
`MARKET_DATA_PROVIDER=sample` or switch to Twelve Data.

## 3. Where your data lives

Everything you type (watchlist, notes, applications, flashcard progress) is saved as
JSON in the `data/` folder. It is gitignored, so it never goes to GitHub.

**Back it up** by copying the `data/` folder somewhere safe (OneDrive, USB stick).

Cached API responses live in `.cache/`. Deleting it is always safe - it just refetches.

## 4. Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build + type check |
| `npm start` | Run the production build |
| `npm run lint` | Check code style |
| `npm test` | Run unit tests |

## 5. Adding a feature

1. **New page:** create `src/app/<name>/page.tsx`, then add it to the nav list in
   `src/components/layout/nav.ts`.
2. **Needs server data?** Add a route handler at `src/app/api/<name>/route.ts`. Put the
   fetching logic in `src/lib/<name>/` and cache it with `cached()` from `src/lib/cache.ts`.
3. **Needs to save something?** Add a collection in `src/lib/store/collections.ts` and use
   the `useCollection()` hook in your component.
4. **New market data provider?** Implement the `MarketProvider` interface in
   `src/lib/markets/providers/` and register it in `providers/index.ts`.
5. Use theme tokens (`bg-surface`, `text-muted`...) not raw colours, so dark mode works.
6. Run `npm run lint && npm test && npm run build` before committing.

See `CLAUDE.md` for conventions and `docs/DESIGN.md` for the architecture.

## 6. GitHub

The repo is **public**: anyone can read the code. Your API keys (`.env.local`) and
personal data (`data/`) are gitignored and never uploaded - keep it that way. Commits
use your GitHub no-reply email address, so your personal email isn't exposed.

## 7. Putting it online (later)

Don't use GitHub Pages - it only hosts static files, and this app needs a server to keep
API keys secret. Options, when you're ready:

- **Vercel** - made by the Next.js team, free hobby tier, keys go in its dashboard.
  Trade-off: its filesystem is read-only, so the `data/` JSON store would need swapping
  for a hosted database (e.g. Vercel Postgres, Supabase, Turso). Anyone with the URL could
  see your notes unless you add a login.
- **A small VPS / Raspberry Pi** - keeps the JSON store as-is, but you manage the server.
- **Keep it local** (the current setup) - simplest and completely private.
