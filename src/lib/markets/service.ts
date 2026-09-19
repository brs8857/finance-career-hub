import "server-only";

import { cached, readCache, writeCache } from "@/lib/cache";
import { fetchBoeSeries, type DatedValue } from "@/lib/macro/boe";
import { findInstrument, UK_10Y_GILT } from "./instruments";
import { activeProvider } from "./providers";
import { sampleHistory, sampleQuote } from "./providers/sample";
import {
  SOURCE_LABELS,
  type ChartRange,
  type HistoryPoint,
  type HistoryResponse,
  type Quote,
  type QuoteResult,
  type QuotesResponse,
  type SymbolInfo,
} from "./types";

// The only entry point route handlers use for market data. It decides which
// provider to call, caches per symbol, and applies the fallback rules:
//   fresh cache -> live fetch -> stale cache (flagged) -> labelled sample data.

const SAMPLE_MODE_NOTE = "Sample mode is switched on (MARKET_DATA_PROVIDER=sample).";

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function sampleResult(symbol: string, note: string): QuoteResult {
  return { source: "sample", fetchedAt: iso(Date.now()), isSample: true, note, quote: sampleQuote(symbol) };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ---------- UK 10-year gilt (Bank of England) ----------

const GILT_SERIES = "IUDMNPY";
const GILT_TTL = 6 * 60 * 60; // BoE publishes daily with a lag; 6 h is plenty

async function giltSeries() {
  const from = new Date(Date.now() - 400 * 24 * 3_600_000);
  return cached(`boe:${GILT_SERIES}`, GILT_TTL, async () => {
    const data = await fetchBoeSeries([GILT_SERIES], from);
    const series = data[GILT_SERIES] ?? [];
    if (series.length < 2) throw new Error("Bank of England returned too little data");
    return series;
  });
}

export function giltQuoteFrom(series: DatedValue[]): Quote {
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  return {
    symbol: UK_10Y_GILT.symbol,
    price: last.value,
    previousClose: prev.value,
    change: last.value - prev.value, // percentage points; shown as basis points
    changePct: ((last.value - prev.value) / prev.value) * 100,
    currency: null,
    asOf: `${last.date}T00:00:00.000Z`,
    spark: series.slice(-30).map((d) => d.value),
  };
}

async function giltQuote(): Promise<QuoteResult> {
  try {
    const { value, storedAt, stale } = await giltSeries();
    return {
      source: "boe",
      fetchedAt: iso(storedAt),
      isSample: false,
      stale,
      quote: giltQuoteFrom(value),
    };
  } catch (error) {
    return sampleResult(UK_10Y_GILT.symbol, `Couldn't reach the Bank of England (${errorText(error)}).`);
  }
}

/** Calendar start of a range ending at `end` (same date one month/year earlier). */
export function rangeStart(end: number, range: ChartRange): number {
  const d = new Date(end);
  if (range === "1D") d.setUTCDate(d.getUTCDate() - 1);
  if (range === "1W") d.setUTCDate(d.getUTCDate() - 7);
  if (range === "1M") d.setUTCMonth(d.getUTCMonth() - 1);
  if (range === "1Y") d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.getTime();
}

/** Daily series -> chart points, measured back from the latest observation. */
export function giltHistoryFrom(series: DatedValue[], range: ChartRange): HistoryPoint[] {
  const points = series.map((d) => ({ t: Date.parse(`${d.date}T00:00:00Z`), v: d.value }));
  const latest = points.at(-1)?.t ?? 0;
  const cutoff = rangeStart(latest, range);
  return points.filter((p) => p.t >= cutoff);
}

// ---------- Quotes ----------

export async function getQuotes(symbols: string[]): Promise<QuotesResponse> {
  const provider = activeProvider();
  const quotes: Record<string, QuoteResult> = {};

  const marketSymbols = symbols.filter((s) => findInstrument(s)?.feed !== "boe");
  if (symbols.includes(UK_10Y_GILT.symbol)) quotes[UK_10Y_GILT.symbol] = await giltQuote();

  if (!provider) {
    for (const s of marketSymbols) quotes[s] = sampleResult(s, SAMPLE_MODE_NOTE);
    return { provider: "sample", quotes };
  }

  const key = (s: string) => `quote:${provider.name}:${s}`;
  const misses: string[] = [];
  const staleCopies = new Map<string, { value: Quote; storedAt: number }>();

  for (const s of marketSymbols) {
    const entry = await readCache<Quote>(key(s));
    if (entry && entry.expiresAt > Date.now()) {
      quotes[s] = { source: provider.name, fetchedAt: iso(entry.storedAt), isSample: false, quote: entry.value };
    } else {
      misses.push(s);
      if (entry) staleCopies.set(s, entry);
    }
  }

  if (misses.length > 0) {
    let fetched = new Map<string, Quote>();
    let failure: unknown = null;
    try {
      fetched = await provider.getQuotes(misses);
    } catch (error) {
      failure = error;
    }

    for (const s of misses) {
      const quote = fetched.get(s);
      if (quote) {
        const entry = await writeCache(key(s), quote, provider.quoteTtlSeconds);
        quotes[s] = { source: provider.name, fetchedAt: iso(entry.storedAt), isSample: false, quote };
        continue;
      }
      const stale = staleCopies.get(s);
      if (stale) {
        quotes[s] = {
          source: provider.name,
          fetchedAt: iso(stale.storedAt),
          isSample: false,
          stale: true,
          note: failure ? `Live update failed (${errorText(failure)}).` : undefined,
          quote: stale.value,
        };
        continue;
      }
      const reason =
        provider.unsupportedReason?.(s) ??
        (failure
          ? `Couldn't reach ${SOURCE_LABELS[provider.name]} (${errorText(failure)}).`
          : `${SOURCE_LABELS[provider.name]} returned no data for this symbol.`);
      quotes[s] = sampleResult(s, reason);
    }
  }

  return { provider: provider.name, quotes };
}

// ---------- History ----------

const HISTORY_TTL: Record<ChartRange, number> = { "1D": 300, "1W": 300, "1M": 3_600, "1Y": 3_600 };

function sampleHistoryResponse(symbol: string, range: ChartRange, note: string): HistoryResponse {
  return {
    symbol,
    range,
    currency: null,
    points: sampleHistory(symbol, range),
    source: "sample",
    fetchedAt: iso(Date.now()),
    isSample: true,
    note,
  };
}

export async function getHistory(symbol: string, range: ChartRange): Promise<HistoryResponse> {
  if (findInstrument(symbol)?.feed === "boe") {
    try {
      const { value, storedAt, stale } = await giltSeries();
      return {
        symbol,
        range,
        currency: null,
        points: giltHistoryFrom(value, range),
        source: "boe",
        fetchedAt: iso(storedAt),
        isSample: false,
        stale,
      };
    } catch (error) {
      return sampleHistoryResponse(symbol, range, `Couldn't reach the Bank of England (${errorText(error)}).`);
    }
  }

  const provider = activeProvider();
  if (!provider) return sampleHistoryResponse(symbol, range, SAMPLE_MODE_NOTE);

  const unsupported = provider.unsupportedReason?.(symbol);
  if (unsupported) return sampleHistoryResponse(symbol, range, unsupported);

  try {
    const { value, storedAt, stale } = await cached(
      `history:${provider.name}:${symbol}:${range}`,
      HISTORY_TTL[range],
      () => provider.getHistory(symbol, range),
    );
    return {
      symbol,
      range,
      currency: value.currency,
      points: value.points,
      source: provider.name,
      fetchedAt: iso(storedAt),
      isSample: false,
      stale,
    };
  } catch (error) {
    return sampleHistoryResponse(symbol, range, `Couldn't load history (${errorText(error)}).`);
  }
}

// ---------- Ticker lookup (used when adding to the watchlist) ----------

export type LookupResult =
  | { status: "found"; info: SymbolInfo; isSample: boolean }
  | { status: "not_found" }
  | { status: "unavailable"; message: string };

export async function lookupSymbol(symbol: string): Promise<LookupResult> {
  const provider = activeProvider();
  if (!provider) {
    // Can't verify in sample mode; accept it and say so.
    return { status: "found", isSample: true, info: { symbol, name: symbol, currency: null, kind: "stock" } };
  }
  try {
    const { value } = await cached(`lookup:${provider.name}:${symbol}`, 7 * 24 * 3_600, () =>
      provider.lookup(symbol),
    );
    return value ? { status: "found", info: value, isSample: false } : { status: "not_found" };
  } catch (error) {
    return { status: "unavailable", message: `Couldn't check that ticker right now (${errorText(error)}).` };
  }
}
