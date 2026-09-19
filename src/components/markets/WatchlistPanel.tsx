"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SampleBadge, StaleBadge } from "@/components/ui/DataStatus";
import { Delta, directionOf } from "@/components/ui/Delta";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatPrice } from "@/lib/format";
import { isValidSymbol } from "@/lib/markets/instruments";
import type { Instrument, QuoteResult, SymbolInfo } from "@/lib/markets/types";
import type { WatchlistItem } from "@/lib/store/collections";

export function watchlistInstrument(item: WatchlistItem): Instrument {
  return { symbol: item.symbol, name: item.name, kind: item.kind, currency: item.currency ?? undefined };
}

type LookupBody =
  | { status: "found"; info: SymbolInfo; isSample: boolean }
  | { status: "not_found" | "invalid" | "unavailable"; message?: string };

export function WatchlistPanel({
  items,
  quotes,
  onAdd,
  onRemove,
  onOpen,
  saveError,
}: {
  items: WatchlistItem[] | undefined;
  quotes: Record<string, QuoteResult> | undefined;
  onAdd: (item: WatchlistItem) => void;
  onRemove: (symbol: string) => void;
  onOpen: (instrument: Instrument) => void;
  saveError: string | null;
}) {
  const [ticker, setTicker] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const inputId = useId();
  const hintId = useId();

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    setMessage(null);
    if (!isValidSymbol(symbol)) {
      setMessage({ tone: "error", text: "That doesn't look like a ticker. Try something like VOD.L or MSFT." });
      return;
    }
    if (items?.some((i) => i.symbol === symbol)) {
      setMessage({ tone: "info", text: `${symbol} is already on your watchlist.` });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/markets/lookup?symbol=${encodeURIComponent(symbol)}`);
      const body = (await res.json()) as LookupBody;
      if (body.status === "found") {
        onAdd({
          symbol: body.info.symbol.toUpperCase(),
          name: body.info.name.slice(0, 120),
          kind: body.info.kind,
          currency: body.info.currency,
        });
        setTicker("");
        setMessage(
          body.isSample
            ? { tone: "info", text: `Added ${symbol}. Sample mode is on, so the ticker couldn't be verified.` }
            : { tone: "info", text: `Added ${body.info.name}.` },
        );
      } else if (body.status === "not_found") {
        setMessage({ tone: "error", text: `Couldn't find ${symbol}. London shares need .L on the end (e.g. BARC.L).` });
      } else {
        setMessage({ tone: "error", text: body.message ?? "Couldn't check that ticker right now. Try again shortly." });
      }
    } catch {
      setMessage({ tone: "error", text: "Couldn't reach the server. Is `npm run dev` still running?" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card aria-labelledby="watchlist-heading">
      <CardHeader title="Watchlist" id="watchlist-heading" description="Your stocks and ETFs. Saved on this computer." />

      <form onSubmit={add} className="mb-3 flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Ticker to add
          </label>
          <input
            id={inputId}
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Add ticker, e.g. BARC.L"
            aria-describedby={hintId}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm uppercase placeholder:normal-case placeholder:text-muted"
          />
        </div>
        <Button type="submit" variant="primary" disabled={busy || !ticker.trim()}>
          <Plus aria-hidden className="size-4" />
          {busy ? "Checking…" : "Add"}
        </Button>
        <p id={hintId} className="basis-full text-xs text-muted">
          Yahoo tickers: London shares end in <code>.L</code> (VOD.L), US shares are plain (MSFT).
        </p>
      </form>

      <div aria-live="polite">
        {message ? (
          <p className={`mb-2 text-xs ${message.tone === "error" ? "text-down" : "text-muted"}`}>{message.text}</p>
        ) : null}
        {saveError ? <p className="mb-2 text-xs text-down">{saveError}</p> : null}
      </div>

      {!items ? (
        <p className="text-sm text-muted">Loading watchlist…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Your watchlist is empty. Add a ticker above.</p>
      ) : (
        <div className="relative -mx-4 overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm">
            <caption className="sr-only">Watchlist prices</caption>
            <thead>
              <tr className="text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2 font-medium">Name</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Price</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Day</th>
                <th scope="col" className="hidden px-2 py-2 font-medium sm:table-cell">
                  <span className="sr-only">Intraday trend</span>
                </th>
                <th scope="col" className="px-4 py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const result = quotes?.[item.symbol];
                const quote = result?.quote;
                const currency = quote?.currency ?? item.currency ?? null;
                return (
                  <tr key={item.symbol} className="border-t border-border">
                    <td className="max-w-[12rem] px-4 py-2">
                      <button
                        type="button"
                        onClick={() => onOpen(watchlistInstrument(item))}
                        className="block max-w-full text-left hover:underline"
                      >
                        <span className="block truncate font-medium">{item.name}</span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          {item.symbol}
                          {result?.isSample ? <SampleBadge title={result.note} /> : null}
                          {result?.stale ? <StaleBadge title={result.note} /> : null}
                        </span>
                      </button>
                    </td>
                    <td className="num px-2 py-2 text-right">
                      {quote ? formatPrice(quote.price, item.kind, currency) : <span className="text-muted">…</span>}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {quote ? (
                        <Delta change={quote.change} changePct={quote.changePct} kind={item.kind} currency={currency} showAbsolute={false} />
                      ) : null}
                    </td>
                    <td className="hidden px-2 py-2 sm:table-cell">
                      {quote ? <Sparkline values={quote.spark} direction={directionOf(quote.changePct)} width={72} height={24} /> : null}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(item.symbol)}
                        className="rounded p-1 text-muted hover:bg-surface-2 hover:text-down"
                        aria-label={`Remove ${item.name} from watchlist`}
                      >
                        <X aria-hidden className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
