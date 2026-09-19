"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataStatus } from "@/components/ui/DataStatus";
import { COMMODITIES, DASHBOARD_INSTRUMENTS, FX, INDICES, RATES } from "@/lib/markets/instruments";
import { SOURCE_LABELS, type DataSource, type Instrument, type Provenance, type QuoteResult } from "@/lib/markets/types";
import { useCollection } from "@/lib/store/useCollection";
import { InstrumentDialog } from "./InstrumentDialog";
import { InstrumentTile } from "./InstrumentTile";
import { TopMovers } from "./TopMovers";
import { useQuotes } from "./useQuotes";
import { watchlistInstrument, WatchlistPanel } from "./WatchlistPanel";

/**
 * Page-level status for the price provider: the OLDEST real fetch time is the
 * honest "last updated". The gilt (Bank of England) shows its own date.
 */
function summarise(
  results: QuoteResult[],
  provider: DataSource | undefined,
): { provenance: Provenance | null; sampleCount: number } {
  const sampleCount = results.filter((r) => r.isSample).length;
  const real = results.filter((r) => !r.isSample && r.source === provider);
  if (real.length === 0) return { provenance: null, sampleCount };
  const oldest = real.reduce((a, b) => (a.fetchedAt < b.fetchedAt ? a : b));
  return {
    provenance: { source: oldest.source, fetchedAt: oldest.fetchedAt, isSample: false, stale: real.some((r) => r.stale) },
    sampleCount,
  };
}

function TileGroup({
  title,
  id,
  instruments,
  quotes,
  onOpen,
}: {
  title: string;
  id: string;
  instruments: Instrument[];
  quotes: Record<string, QuoteResult> | undefined;
  onOpen: (instrument: Instrument) => void;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {instruments.map((instrument) => (
          <InstrumentTile
            key={instrument.symbol}
            instrument={instrument}
            result={quotes?.[instrument.symbol]}
            onOpen={() => onOpen(instrument)}
          />
        ))}
      </div>
    </section>
  );
}

export function MarketsDashboard() {
  const watchlist = useCollection("watchlist");
  const items = watchlist.data;

  // One request for everything on the page (Yahoo gets one batched call).
  // Wait for the watchlist first so the page doesn't fetch twice.
  const watchlistReady = watchlist.status !== "loading";
  const symbols = useMemo(
    () =>
      watchlistReady
        ? [...new Set([...DASHBOARD_INSTRUMENTS.map((i) => i.symbol), ...(items ?? []).map((i) => i.symbol)])]
        : [],
    [items, watchlistReady],
  );
  const { data, error, loading, refresh } = useQuotes(symbols);
  const quotes = data?.quotes;
  const [open, setOpen] = useState<Instrument | null>(null);

  const { provenance, sampleCount } = summarise(Object.values(quotes ?? {}), data?.provider);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="text-xs text-muted">
          {data ? (
            <>
              <p>
                Prices from <strong className="text-fg">{SOURCE_LABELS[data.provider]}</strong>, UK gilt yield from the
                Bank of England. Responses are cached to stay within free rate limits.
              </p>
              {provenance ? <DataStatus provenance={provenance} className="mt-1" /> : null}
              {sampleCount > 0 ? (
                <p className="mt-1">
                  {sampleCount} item{sampleCount === 1 ? " is" : "s are"} showing sample data - hover the amber badge for
                  the reason.
                </p>
              ) : null}
            </>
          ) : error ? (
            <p role="alert" className="text-down">
              Couldn&apos;t load prices: {error}
            </p>
          ) : (
            <p>Loading prices…</p>
          )}
        </div>
        <Button onClick={refresh} disabled={loading} size="sm">
          <RefreshCw aria-hidden className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Updating…" : "Check for updates"}
        </Button>
      </div>

      <TileGroup title="Indices" id="indices-heading" instruments={INDICES} quotes={quotes} onOpen={setOpen} />

      <div className="grid gap-8 lg:grid-cols-2">
        <TileGroup title="Currencies" id="fx-heading" instruments={FX} quotes={quotes} onOpen={setOpen} />
        <TileGroup
          title="Commodities & rates"
          id="commodities-heading"
          instruments={[...COMMODITIES, ...RATES]}
          quotes={quotes}
          onOpen={setOpen}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {watchlist.status === "error" ? (
            <Card>
              <CardHeader title="Watchlist" />
              <p role="alert" className="text-sm text-down">
                Couldn&apos;t load your watchlist: {watchlist.error}
              </p>
            </Card>
          ) : (
            <WatchlistPanel
              items={items}
              quotes={quotes}
              saveError={watchlist.saveError}
              onOpen={setOpen}
              onAdd={(item) => watchlist.update((list) => [...list, item])}
              onRemove={(symbol) => watchlist.update((list) => list.filter((i) => i.symbol !== symbol))}
            />
          )}
        </div>
        <TopMovers items={items} quotes={quotes} onOpen={(item) => setOpen(watchlistInstrument(item))} />
      </div>

      <InstrumentDialog instrument={open} result={open ? quotes?.[open.symbol] : undefined} onClose={() => setOpen(null)} />
    </div>
  );
}
