# Progress

Checklist of build phases. Dates are when the phase was committed.

| # | Phase | Status | Completed |
|---|---|---|---|
| 0 | Project setup, Git, docs | ✅ Done | 2026-09-19 |
| 1 | Foundation + Markets | ✅ Done | 2026-09-19 |
| 2 | Macro panel | ✅ Done | 2026-09-19 |
| 3 | Commercial awareness | ⬜ Not started | |
| 4 | Application tracker | ⬜ Not started | |
| 5 | Technical flashcards | ⬜ Not started | |
| 6 | Pathways guide | ⬜ Not started | |
| - | Home page (today at a glance, weekly goals) | ⬜ Not started | |

## Phase 0 - Project setup, Git, docs

- [x] Next.js 16 + TypeScript + Tailwind v4 scaffold
- [x] `.gitignore` written before the first commit (env files, `data/`, `.cache/`, builds, OS junk)
- [x] `.env.example` with placeholder values only
- [x] `CLAUDE.md`, `README.md`, `docs/PROGRESS.md`, `docs/LEARNING-LOG.md`, `docs/DESIGN.md`
- [x] `git init` on `main`, first commit
- [ ] Private GitHub repo `brs8857/finance-career-hub` created and pushed (needs GitHub CLI - see README)

## Phase 1 - Foundation + Markets

- [x] Layout: sidebar (desktop), slide-over menu (mobile), skip link, footer disclaimer
- [x] Light / dark / system theme, no flash on load, AA contrast checked for every text pair
- [x] Provider adapters: Yahoo (default), Twelve Data (optional), labelled sample mode
- [x] Server cache (memory + `.cache/`), throttled upstream calls, stale-copy fallback
- [x] Indices: FTSE 100, FTSE 250, S&P 500, Nasdaq, DAX, Nikkei 225
- [x] FX (GBP/USD, GBP/EUR, USD/JPY), Brent, gold, UK 10y gilt (Bank of England)
- [x] Sparklines + 1D / 1W / 1M / 1Y charts with hover tooltip and data-table view
- [x] Editable watchlist (ticker verified before adding), saved to `data/watchlist.json`
- [x] Top movers for the watchlist (sample data never counted)
- [x] "My take" notes per instrument, dated, with the real move captured alongside
- [x] 49 unit tests (parsers, cache, fallbacks, formatting, ranking)

## Phase 2 - Macro panel

- [x] UK: Bank Rate (BoE), CPI (ONS D7G7), GDP q/q + y/y (ONS IHYQ/IHYR, newest of PN2/QNA), unemployment (ONS MGSX)
- [x] US: Fed funds target range, CPI y/y, real GDP (annualised) + y/y, unemployment (FRED)
- [x] Yield curves: UK (SONIA + BoE 5/10/20y par yields), US (Treasury 1M-30Y), slopes in bp
- [x] History charts since 2019 with tooltips, 2% target line on UK CPI, data tables
- [x] Release date / next release (ONS), last rate change (policy rates), source links
- [x] Explainers: what it is / why markets care / syllabus links, for every indicator
- [x] 64 unit tests

## Known issues

- GitHub CLI (`gh`) is not installed on this machine, so the remote hasn't been created yet.
- Twelve Data provider is written against its published docs but hasn't been run
  with a real key yet. Try it with `MARKET_DATA_PROVIDER=twelvedata` and report issues.
  Its free tier allows 8 requests/minute, so a cold load of the dashboard is slow.
- US macro cards need a free FRED key (README section 2); until then they show an
  "unavailable" state rather than numbers. The US yield curve works without it.
- FRED's keyless CSV download timed out from this machine, so only the keyed API is used.
- UK curve has four points (overnight, 5y, 10y, 20y): the BoE database series used
  here don't include short-dated gilt par yields.
- The Bank of England publishes gilt yields with a lag of a few working days; the
  tile shows the observation date.
- Yahoo Finance's chart endpoint is unofficial and rate-limits bursts. Mitigated by
  throttling + caching; fallback is sample-data mode or Twelve Data.
