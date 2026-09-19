import type { ChartRange, HistoryPoint, Quote } from "../types";

// SAMPLE DATA - NOT REAL PRICES.
//
// Used when a provider is unavailable, a key is missing, or
// MARKET_DATA_PROVIDER=sample. Every series is a smooth synthetic wave
// indexed around 100, so it can't be mistaken for a real level (the real
// FTSE 100 is in the thousands). The UI always shows a SAMPLE DATA badge.

function seedFrom(symbol: string): number {
  let hash = 0;
  for (const char of symbol) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (hash % 1000) / 1000; // 0..1, stable per symbol
}

function wave(seed: number, i: number, n: number): number {
  const x = (i / Math.max(n - 1, 1)) * Math.PI * 2;
  return 100 + 4 * Math.sin(x + seed * 6) + 1.5 * Math.sin(3 * x + seed * 11);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sampleQuote(symbol: string): Quote {
  const seed = seedFrom(symbol);
  const spark = Array.from({ length: 40 }, (_, i) => round(wave(seed, i, 40)));
  const price = spark[spark.length - 1];
  const previousClose = 100;
  return {
    symbol,
    price,
    previousClose,
    change: round(price - previousClose),
    changePct: round(((price - previousClose) / previousClose) * 100),
    currency: null,
    asOf: null,
    spark,
  };
}

const RANGE_SHAPE: Record<ChartRange, { points: number; stepMs: number }> = {
  "1D": { points: 78, stepMs: 5 * 60_000 },
  "1W": { points: 65, stepMs: 30 * 60_000 },
  "1M": { points: 22, stepMs: 24 * 3_600_000 },
  "1Y": { points: 252, stepMs: 24 * 3_600_000 },
};

export function sampleHistory(symbol: string, range: ChartRange, now = Date.now()): HistoryPoint[] {
  const seed = seedFrom(symbol + range);
  const { points, stepMs } = RANGE_SHAPE[range];
  return Array.from({ length: points }, (_, i) => ({
    t: now - (points - 1 - i) * stepMs,
    v: round(wave(seed, i, points)),
  }));
}
