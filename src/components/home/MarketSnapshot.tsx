"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataStatus, SampleBadge, StaleBadge } from "@/components/ui/DataStatus";
import { Delta } from "@/components/ui/Delta";
import { useQuotes } from "@/components/markets/useQuotes";
import { formatPrice } from "@/lib/format";
import { findInstrument } from "@/lib/markets/instruments";
import type { Provenance } from "@/lib/markets/types";

const SNAPSHOT = ["^FTSE", "^FTMC", "^GSPC", "GBPUSD=X", "UK10Y"];

export function MarketSnapshot() {
  const { data, error } = useQuotes(SNAPSHOT);
  const results = SNAPSHOT.map((s) => data?.quotes[s]).filter(Boolean);
  const real = results.filter((r) => r && !r.isSample && r.source === data?.provider);
  const oldest = real.length ? real.reduce((a, b) => (a!.fetchedAt < b!.fetchedAt ? a : b)) : null;

  return (
    <Card aria-labelledby="snapshot-heading" className="flex flex-col">
      <CardHeader
        title="Market snapshot"
        id="snapshot-heading"
        action={
          <Link href="/markets" className="text-xs text-accent hover:underline">
            Markets →
          </Link>
        }
      />
      {error && !data ? (
        <p role="alert" className="text-sm text-down">
          Couldn&apos;t load prices: {error}
        </p>
      ) : (
        <ul className="flex-1 divide-y divide-border">
          {SNAPSHOT.map((symbol) => {
            const instrument = findInstrument(symbol)!;
            const r = data?.quotes[symbol];
            return (
              <li key={symbol} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{instrument.name}</span>
                  {r?.isSample ? <SampleBadge title={r.note} /> : r?.stale ? <StaleBadge title={r.note} /> : null}
                </span>
                {r ? (
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="num font-medium">{formatPrice(r.quote.price, instrument.kind, instrument.currency)}</span>
                    <Delta
                      change={r.quote.change}
                      changePct={r.quote.changePct}
                      kind={instrument.kind}
                      showAbsolute={instrument.kind === "yield"}
                      className="w-20 justify-end text-xs"
                    />
                  </span>
                ) : (
                  <span aria-hidden className="h-4 w-24 animate-pulse rounded bg-surface-2" />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {oldest ? (
        <DataStatus
          provenance={{ source: oldest.source, fetchedAt: oldest.fetchedAt, isSample: false, stale: real.some((r) => r!.stale) } as Provenance}
          className="mt-2"
        />
      ) : null}
    </Card>
  );
}
