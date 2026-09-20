import type { ChartRange, HistoryPoint, InstrumentKind, Quote, SymbolInfo } from "../types";
import type { MarketProvider } from "./provider";
import { createThrottle } from "@/lib/throttle";

// Yahoo Finance chart endpoints. Keyless and unofficial: fine for a personal
// learning tool, not for anything commercial. Covers UK/EU/Asia indices,
// FX, futures and LSE shares, which free official tiers don't.
//
// Facts checked against live responses (2026-09-19):
// - /v8/finance/spark returns many symbols in ONE request, each with
//   previousClose, fulldayPrice, fulldayChange, fulldayChangePercent (percent units).
// - Trailing intraday closes can be null (FX, futures) - skip them.
// - LSE shares are priced in pence: currency "GBp".
// - Daily change must come from previousClose, NOT from the last two daily
//   bars: on 18 Sep 2026 the FTSE 100 daily bars implied a prior close of
//   10,816.1 but Yahoo's own previousClose (and its published change) used 10,688.5.
// - Bursts get blocked (404s), so all calls go through a throttle.

const BASE = "https://query1.finance.yahoo.com";
const HEADERS = { "User-Agent": "Mozilla/5.0 (market-tracker; personal learning project)" };
const SPARK_BATCH = 20;

const throttle = createThrottle(500);

type Num = number | null | undefined;

interface SparkEntry {
  symbol?: string;
  timestamp?: number[];
  close?: Num[];
  previousClose?: Num;
  chartPreviousClose?: Num;
  fulldayPrice?: Num;
  fulldayChange?: Num;
  fulldayChangePercent?: Num;
}

interface ChartMeta {
  symbol?: string;
  currency?: string;
  longName?: string;
  shortName?: string;
  instrumentType?: string;
  regularMarketPrice?: Num;
  regularMarketTime?: number;
  previousClose?: Num;
  chartPreviousClose?: Num;
}

interface ChartResponse {
  chart?: {
    result?: Array<{
      meta?: ChartMeta;
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Num[] }> };
    }> | null;
    error?: { code?: string; description?: string } | null;
  };
}

function isNum(value: Num): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Keep at most `max` points, evenly spaced, always including the last one. */
export function downsample<T>(values: T[], max: number): T[] {
  if (values.length <= max) return values;
  const step = (values.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => values[Math.round(i * step)]);
}

/** Turn one symbol's spark payload into a Quote, or null if it has no usable price. */
export function parseSparkEntry(symbol: string, entry: SparkEntry | undefined): Quote | null {
  if (!entry) return null;
  const timestamps = entry.timestamp ?? [];
  const closes = entry.close ?? [];

  const series: Array<{ t: number; v: number }> = [];
  closes.forEach((v, i) => {
    if (isNum(v) && isNum(timestamps[i])) series.push({ t: timestamps[i], v });
  });

  // Price = last regular-session close. Don't use `fulldayPrice`: for US
  // shares it includes extended hours (AAPL on 18 Sep 2026: fulldayPrice
  // 334.80 vs regular close 336.13) while `fulldayChange` is regular-session,
  // so mixing them gives a price and a change that don't agree. Checked the
  // last close against Yahoo's regularMarketPrice for all 17 default symbols.
  const last = series.at(-1);
  if (!last) return null;
  const price = last.v;

  const previousClose = isNum(entry.previousClose)
    ? entry.previousClose
    : isNum(entry.chartPreviousClose)
      ? entry.chartPreviousClose
      : null;

  // Always derive the change from the same price we display.
  const change = previousClose != null ? price - previousClose : null;
  const changePct = previousClose ? (change! / previousClose) * 100 : null;

  return {
    symbol,
    price,
    previousClose,
    change,
    changePct,
    currency: null, // spark doesn't include currency; instrument config supplies it
    asOf: last ? new Date(last.t * 1000).toISOString() : null,
    spark: downsample(
      series.map((p) => p.v),
      60,
    ),
  };
}

/** Parse a chart response into points + meta. Throws on API-level errors. */
export function parseChart(raw: ChartResponse): { points: HistoryPoint[]; meta: ChartMeta } {
  const error = raw.chart?.error;
  if (error) throw new Error(`Yahoo: ${error.description ?? error.code ?? "unknown error"}`);
  const result = raw.chart?.result?.[0];
  if (!result) throw new Error("Yahoo: empty chart result");

  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: HistoryPoint[] = [];
  closes.forEach((v, i) => {
    if (isNum(v) && isNum(timestamps[i])) points.push({ t: timestamps[i] * 1000, v });
  });
  return { points, meta: result.meta ?? {} };
}

function kindFromYahoo(type: string | undefined): InstrumentKind {
  switch (type) {
    case "ETF":
    case "MUTUALFUND":
      return "etf";
    case "INDEX":
      return "index";
    case "CURRENCY":
      return "fx";
    case "FUTURE":
      return "commodity";
    default:
      return "stock";
  }
}

const RANGE_PARAMS: Record<ChartRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};

async function getJson<T>(url: string): Promise<T> {
  return throttle(async () => {
    const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) {
      // An unknown symbol is a 404 WITH a JSON error body ("No data found...").
      // Rate limiting is also a 404/429 but without that body. Keep them apart
      // so a rate limit is never reported as "ticker doesn't exist".
      const body = (await res.json().catch(() => null)) as ChartResponse | null;
      const description = body?.chart?.error?.description;
      throw new Error(description ? `Yahoo: ${description}` : `Yahoo HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  });
}

export const yahooProvider: MarketProvider = {
  name: "yahoo",
  quoteTtlSeconds: 5 * 60,

  async getQuotes(symbols) {
    const out = new Map<string, Quote>();
    for (let i = 0; i < symbols.length; i += SPARK_BATCH) {
      const batch = symbols.slice(i, i + SPARK_BATCH);
      const url = `${BASE}/v8/finance/spark?symbols=${batch.map(encodeURIComponent).join(",")}&range=1d&interval=5m`;
      const raw = await getJson<Record<string, SparkEntry>>(url);
      for (const symbol of batch) {
        const quote = parseSparkEntry(symbol, raw[symbol]);
        if (quote) out.set(symbol, quote);
      }
    }
    return out;
  },

  async getHistory(symbol, range) {
    const { range: r, interval } = RANGE_PARAMS[range];
    const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`;
    const { points, meta } = parseChart(await getJson<ChartResponse>(url));
    return { points, currency: meta.currency ?? null };
  },

  async lookup(symbol): Promise<SymbolInfo | null> {
    const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    try {
      const { meta } = parseChart(await getJson<ChartResponse>(url));
      if (!isNum(meta.regularMarketPrice)) return null;
      return {
        symbol: meta.symbol ?? symbol,
        name: meta.longName ?? meta.shortName ?? symbol,
        currency: meta.currency ?? null,
        kind: kindFromYahoo(meta.instrumentType),
      };
    } catch (error) {
      if (error instanceof Error && /No data found|delisted/i.test(error.message)) {
        return null;
      }
      throw error;
    }
  },
};
