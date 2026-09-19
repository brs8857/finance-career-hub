"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Delta } from "@/components/ui/Delta";
import type { QuoteResult } from "@/lib/markets/types";
import type { WatchlistItem } from "@/lib/store/collections";

export interface Mover {
  item: WatchlistItem;
  result: QuoteResult;
  changePct: number;
}

/** Split real (non-sample) watchlist quotes into biggest risers and fallers. */
export function rankMovers(
  items: WatchlistItem[],
  quotes: Record<string, QuoteResult>,
  count = 3,
): { gainers: Mover[]; losers: Mover[]; excluded: number } {
  const movers: Mover[] = [];
  let excluded = 0;
  for (const item of items) {
    const result = quotes[item.symbol];
    const pct = result?.quote.changePct;
    if (!result || result.isSample || pct == null || !Number.isFinite(pct)) {
      excluded++;
      continue;
    }
    movers.push({ item, result, changePct: pct });
  }
  const gainers = movers.filter((m) => m.changePct > 0).sort((a, b) => b.changePct - a.changePct);
  const losers = movers.filter((m) => m.changePct < 0).sort((a, b) => a.changePct - b.changePct);
  return { gainers: gainers.slice(0, count), losers: losers.slice(0, count), excluded };
}

function MoverList({ title, movers, onOpen }: { title: string; movers: Mover[]; onOpen: (m: Mover) => void }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium text-muted">{title}</h3>
      {movers.length === 0 ? (
        <p className="text-sm text-muted">None today.</p>
      ) : (
        <ol className="space-y-1">
          {movers.map((m) => (
            <li key={m.item.symbol}>
              <button
                type="button"
                onClick={() => onOpen(m)}
                className="flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left text-sm hover:bg-surface-2"
              >
                <span className="truncate">{m.item.name}</span>
                <Delta change={m.result.quote.change} changePct={m.changePct} kind={m.item.kind} showAbsolute={false} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function TopMovers({
  items,
  quotes,
  onOpen,
}: {
  items: WatchlistItem[] | undefined;
  quotes: Record<string, QuoteResult> | undefined;
  onOpen: (item: WatchlistItem) => void;
}) {
  const ranked = items && quotes ? rankMovers(items, quotes) : null;
  return (
    <Card aria-labelledby="movers-heading">
      <CardHeader title="Top movers" id="movers-heading" description="Your watchlist, by % change on the day." />
      {!ranked ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          <MoverList title="Risers" movers={ranked.gainers} onOpen={(m) => onOpen(m.item)} />
          <MoverList title="Fallers" movers={ranked.losers} onOpen={(m) => onOpen(m.item)} />
          {ranked.excluded > 0 ? (
            <p className="text-xs text-muted">
              {ranked.excluded} watchlist item{ranked.excluded === 1 ? "" : "s"} left out because only sample data is
              available.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
