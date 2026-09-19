import "server-only";

import type { ChartRange, HistoryPoint, InstrumentKind, Quote, SymbolInfo } from "../types";
import type { MarketProvider } from "./provider";
import { readKey } from "@/lib/env";
import { createThrottle } from "@/lib/throttle";

// Twelve Data (https://twelvedata.com/docs). Official API, free Basic plan:
// 800 credits/day, 8 per minute, mostly US stocks/ETFs + FX. International
// exchanges and most non-US indices need a paid plan, so those symbols are
// reported as unsupported and shown as labelled sample data.
//
// NOTE: written against the published docs; verify with a real key
// (MARKET_DATA_PROVIDER=twelvedata) before relying on it.
//
// Response facts from the docs: numeric fields are strings; time_series
// `values` are newest-first; errors are { status: "error", code, message }.

const BASE = "https://api.twelvedata.com";

// 8 requests/minute on the free plan -> one every 7.6 s.
const throttle = createThrottle(7_600);

/** Our Yahoo-style symbols -> Twelve Data symbols. Unmapped = unsupported. */
const SYMBOL_MAP: Record<string, string> = {
  "^GSPC": "SPX",
  "^IXIC": "IXIC",
  "GBPUSD=X": "GBP/USD",
  "GBPEUR=X": "GBP/EUR",
  "JPY=X": "USD/JPY",
  // Spot gold, not the COMEX future Yahoo uses - labelled in the note below.
  "GC=F": "XAU/USD",
};

export function toTwelveSymbol(symbol: string): string | null {
  if (SYMBOL_MAP[symbol]) return SYMBOL_MAP[symbol];
  // Plain US tickers pass through. In Yahoo-style symbols a dot always means
  // an exchange suffix (VOD.L, SAP.DE); US share classes use a hyphen
  // (BRK-B), which Twelve Data writes as BRK.B.
  if (/^[A-Z][A-Z0-9]{0,5}(-[A-Z])?$/.test(symbol)) return symbol.replace("-", ".");
  return null; // LSE (.L), non-US indices, futures: paid plan only
}

interface TdError {
  status: "error";
  code?: number;
  message?: string;
}

interface TdQuote {
  symbol?: string;
  name?: string;
  currency?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  timestamp?: number;
}

interface TdSeries {
  meta?: { currency?: string; type?: string };
  values?: Array<{ datetime: string; close: string }>;
  status?: string;
}

function num(value: string | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isError(body: unknown): body is TdError {
  return typeof body === "object" && body !== null && (body as TdError).status === "error";
}

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = readKey("TWELVE_DATA_API_KEY");
  if (!key) throw new Error("TWELVE_DATA_API_KEY is not set");
  const query = new URLSearchParams({ ...params, apikey: key });
  return throttle(async () => {
    const res = await fetch(`${BASE}${path}?${query}`, { cache: "no-store" });
    const body = (await res.json()) as unknown;
    if (!res.ok || isError(body)) {
      const message = isError(body) ? body.message : `HTTP ${res.status}`;
      throw new Error(`Twelve Data: ${message}`);
    }
    return body as T;
  });
}

export function parseTdQuote(symbol: string, raw: TdQuote): Quote | null {
  const price = num(raw.close);
  if (price == null) return null;
  return {
    symbol,
    price,
    previousClose: num(raw.previous_close),
    change: num(raw.change),
    changePct: num(raw.percent_change),
    currency: raw.currency ?? null,
    asOf: raw.timestamp ? new Date(raw.timestamp * 1000).toISOString() : null,
    spark: [],
  };
}

/** Twelve Data datetimes have no zone; treat them as UTC (close enough for charts). */
export function parseTdSeries(raw: TdSeries): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (const row of raw.values ?? []) {
    const v = num(row.close);
    const t = Date.parse(row.datetime.includes(" ") ? `${row.datetime.replace(" ", "T")}Z` : `${row.datetime}T00:00:00Z`);
    if (v != null && Number.isFinite(t)) points.push({ t, v });
  }
  return points.reverse(); // API is newest-first; charts want oldest-first
}

const RANGE_PARAMS: Record<ChartRange, { interval: string; outputsize: string }> = {
  "1D": { interval: "5min", outputsize: "78" },
  "1W": { interval: "30min", outputsize: "70" },
  "1M": { interval: "1day", outputsize: "23" },
  "1Y": { interval: "1day", outputsize: "252" },
};

function kindFromTd(type: string | undefined): InstrumentKind {
  if (!type) return "stock";
  if (/etf/i.test(type)) return "etf";
  if (/index/i.test(type)) return "index";
  return "stock";
}

export const twelveDataProvider: MarketProvider = {
  name: "twelvedata",
  quoteTtlSeconds: 15 * 60, // free tier is slow; refresh less often

  unsupportedReason(symbol) {
    if (!readKey("TWELVE_DATA_API_KEY")) return "Add TWELVE_DATA_API_KEY to .env.local.";
    if (!toTwelveSymbol(symbol)) return "Not available on the Twelve Data free plan.";
    return null;
  },

  async getQuotes(symbols) {
    const out = new Map<string, Quote>();
    for (const symbol of symbols) {
      const td = toTwelveSymbol(symbol);
      if (!td) continue;
      try {
        const quote = parseTdQuote(symbol, await call<TdQuote>("/quote", { symbol: td }));
        if (quote) out.set(symbol, quote);
      } catch (error) {
        // One unsupported symbol shouldn't sink the rest; a missing key should.
        if (error instanceof Error && /API_KEY is not set/.test(error.message)) throw error;
      }
    }
    return out;
  },

  async getHistory(symbol, range) {
    const td = toTwelveSymbol(symbol);
    if (!td) throw new Error("Not available on the Twelve Data free plan.");
    const raw = await call<TdSeries>("/time_series", { symbol: td, ...RANGE_PARAMS[range] });
    return { points: parseTdSeries(raw), currency: raw.meta?.currency ?? null };
  },

  async lookup(symbol): Promise<SymbolInfo | null> {
    const td = toTwelveSymbol(symbol);
    if (!td) return null;
    try {
      const raw = await call<TdQuote & { type?: string }>("/quote", { symbol: td });
      if (num(raw.close) == null) return null;
      return {
        symbol,
        name: raw.name ?? symbol,
        currency: raw.currency ?? null,
        kind: kindFromTd(raw.type),
      };
    } catch (error) {
      if (error instanceof Error && /not found|invalid|symbol/i.test(error.message)) return null;
      throw error;
    }
  },
};
