# Progress

Checklist of build phases. Dates are when the phase was committed.

| # | Phase | Status | Completed |
|---|---|---|---|
| 0 | Project setup, Git, docs | ✅ Done | 2026-09-19 |
| 1 | Foundation + Markets | ⬜ Not started | |
| 2 | Macro panel | ⬜ Not started | |
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

## Known issues

- GitHub CLI (`gh`) is not installed on this machine, so the remote hasn't been created yet.
- Yahoo Finance's chart endpoint is unofficial and rate-limits bursts. Mitigated by
  throttling + caching; fallback is sample-data mode or Twelve Data.
