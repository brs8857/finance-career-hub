"use client";

import { SampleBadge, StaleBadge } from "@/components/ui/DataStatus";
import { Delta, directionOf } from "@/components/ui/Delta";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatChange, formatPct, formatPrice } from "@/lib/format";
import type { Instrument, QuoteResult } from "@/lib/markets/types";

/** A clickable card for one dashboard instrument. */
export function InstrumentTile({
  instrument,
  result,
  onOpen,
}: {
  instrument: Instrument;
  result: QuoteResult | undefined;
  onOpen: () => void;
}) {
  const quote = result?.quote;
  const currency = quote?.currency ?? instrument.currency ?? null;
  const dir = directionOf(quote?.changePct ?? quote?.change);
  const change =
    instrument.kind === "yield"
      ? formatChange(quote?.change, "yield")
      : formatPct(quote?.changePct);
  const label = quote
    ? `${instrument.name}: ${formatPrice(quote.price, instrument.kind, currency)}, ${change} on the day${
        result?.isSample ? " (sample data)" : ""
      }. Open details.`
    : `${instrument.name}: loading. Open details.`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="group flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left transition hover:border-accent/60 hover:bg-surface-2"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{instrument.name}</p>
          {instrument.detail ? <p className="truncate text-xs text-muted">{instrument.detail}</p> : null}
        </div>
        {result?.isSample ? <SampleBadge title={result.note} /> : result?.stale ? <StaleBadge title={result.note} /> : null}
      </div>

      {quote ? (
        <div className="flex w-full items-end justify-between gap-2">
          <div>
            <p className="num text-lg font-semibold">{formatPrice(quote.price, instrument.kind, currency)}</p>
            <Delta
              change={quote.change}
              changePct={quote.changePct}
              kind={instrument.kind}
              currency={currency}
              showAbsolute={instrument.kind === "yield"}
              className="text-xs"
            />
          </div>
          <Sparkline values={quote.spark} direction={dir} />
        </div>
      ) : (
        <div aria-hidden className="h-11 w-full animate-pulse rounded bg-surface-2" />
      )}
    </button>
  );
}
