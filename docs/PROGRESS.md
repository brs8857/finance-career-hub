# Progress

Checklist of build phases. Dates are when the phase was committed.

| # | Phase | Status | Completed |
|---|---|---|---|
| 0 | Project setup, Git, docs | ✅ Done | 2026-09-19 |
| 1 | Foundation + Markets | ✅ Done | 2026-09-19 |
| 2 | Macro panel | ✅ Done | 2026-09-19 |
| 3 | Commercial awareness | ✅ Done | 2026-09-19 |
| 4 | Application tracker | ✅ Done | 2026-09-19 |
| 5 | Technical flashcards | ✅ Done | 2026-09-19 |
| 6 | Pathways guide | ✅ Done | 2026-09-19 |
| - | Home page (today at a glance, weekly goals) | ✅ Done | 2026-09-19 |

## Phase 0 - Project setup, Git, docs

- [x] Next.js 16 + TypeScript + Tailwind v4 scaffold
- [x] `.gitignore` written before the first commit (env files, `data/`, `.cache/`, builds, OS junk)
- [x] `.env.example` with placeholder values only
- [x] `CLAUDE.md`, `README.md`, `docs/PROGRESS.md`, `docs/LEARNING-LOG.md`, `docs/DESIGN.md`
- [x] `git init` on `main`, first commit
- [x] Private GitHub repo `brs8857/market-tracker` created and pushed (2026-09-19)

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

## Phase 3 - Commercial awareness

- [x] Headline feed from 7 public RSS feeds: BBC Business, Guardian Business, Guardian
      Economics, Sky News Business, City AM, Financial Times (headlines only), Bank of England
- [x] Headlines + links only; descriptions never read or stored; http(s) links only
- [x] Grouped by UK day, filter by source, per-feed status, 30-minute cache
- [x] Save a story + three-part note (what happened / why it matters / what next) + tags
- [x] Searchable archive (all words, all fields, accent-insensitive), tag filters, edit/delete
- [x] 76 unit tests

## Phase 4 - Application tracker

- [x] Kanban: Researching, Applying, Applied, Online tests, Interview, Offer, Rejected
- [x] Fields: employer, role, route (spring week / internship / grad scheme / apprenticeship /
      degree apprenticeship), deadline, rolling flag, link, notes, contacts
- [x] Move cards by drag-and-drop OR a per-card "Move to" menu (keyboard + touch)
- [x] Stage history recorded (feeds the weekly "applications progressed" goal)
- [x] Deadline view: overdue / next 7 days / next 30 days / later, with countdowns in UK dates
- [x] Nothing pre-filled - no real employers or deadlines
- [x] Fixed: sr-only labels escaping horizontal scrollers caused page-wide sideways scroll
- [x] 84 unit tests

## Phase 5 - Technical flashcards

- [x] Leitner spaced repetition: 5 boxes at 1 / 3 / 7 / 14 / 30 days; wrong answer -> box 1
- [x] Seeded decks, 20 cards each: accounting (three statements, double entry, depreciation),
      corporate finance (DCF, WACC, P/E, EV vs equity value), economics (elasticity,
      multipliers, monetary policy transmission)
- [x] Add / edit / delete your own cards, in any deck or "My cards"
- [x] Keyboard study: Space to reveal, 1 = not yet, 2 = got it; missed cards practised once at the end
- [x] Due / new / mastered counts per deck; daily review log (feeds streaks and weekly goals)
- [x] 93 unit tests, including deck integrity (unique permanent ids)

## Phase 6 - Pathways guide

- [x] Nine routes: ACA, ACCA, CIMA, investment banking, sales & trading, asset management,
      economic consulting, Government Economic Service, central banking
- [x] For each: what the job involves, entry routes, qualifications, what to do at your stage
- [x] At-a-glance comparison table and an ACA vs ACCA vs CIMA table
- [x] "Details change" banner with last-reviewed date, change warnings for ACA and ACCA,
      official source links (all checked to resolve on 2026-09-19)
- [x] Specific figures (exam counts, experience requirements, GES entry criteria) verified
      against ICAEW, ACCA, AICPA & CIMA and GOV.UK pages
- [x] 95 unit tests

## Home page

- [x] Today at a glance: market snapshot, cards due, next deadline, "commercial awareness done today?" tick
- [x] Weekly goals (notes, cards, applications progressed), editable, Monday-Sunday UK weeks
- [x] Daily activity streak + consecutive weeks with every goal met
- [x] Date-dependent parts render in the browser only (the page is prerendered at build time)
- [x] Fixed: watchlist table forced sideways scrolling on 375px phones (grid item needed min-w-0)
- [x] Final check: all 10 pages at 375px - no horizontal scroll, disclaimer footer present
- [x] 101 unit tests; lint and production build clean

## Known issues

- Twelve Data provider is written against its published docs but hasn't been run
  with a real key yet. Try it with `MARKET_DATA_PROVIDER=twelvedata` and report issues.
  Its free tier allows 8 requests/minute, so a cold load of the dashboard is slow.
- Pathways content needs a yearly review (bump LAST_REVIEWED in src/content/pathways.ts).
  CFA UK's IMC page couldn't be found, so the IMC is mentioned without a link.
- Reuters no longer offers public RSS feeds, so it isn't included.
- US macro cards need a free FRED key (README section 2); until then they show an
  "unavailable" state rather than numbers. The US yield curve works without it.
- FRED's keyless CSV download timed out from this machine, so only the keyed API is used.
- UK curve has four points (overnight, 5y, 10y, 20y): the BoE database series used
  here don't include short-dated gilt par yields.
- The Bank of England publishes gilt yields with a lag of a few working days; the
  tile shows the observation date.
- Yahoo Finance's chart endpoint is unofficial and rate-limits bursts. Mitigated by
  throttling + caching; fallback is sample-data mode or Twelve Data.
