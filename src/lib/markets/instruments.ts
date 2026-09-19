// The fixed instruments on the markets dashboard. These are identifiers
// only - no prices live here. Prices always come from a provider at runtime.

import type { Instrument } from "./types";

export const INDICES: Instrument[] = [
  { symbol: "^FTSE", name: "FTSE 100", kind: "index", currency: "GBP", detail: "UK large caps" },
  { symbol: "^FTMC", name: "FTSE 250", kind: "index", currency: "GBP", detail: "UK mid caps" },
  { symbol: "^GSPC", name: "S&P 500", kind: "index", currency: "USD", detail: "US large caps" },
  { symbol: "^IXIC", name: "Nasdaq Composite", kind: "index", currency: "USD", detail: "US, tech-heavy" },
  { symbol: "^GDAXI", name: "DAX", kind: "index", currency: "EUR", detail: "Germany" },
  { symbol: "^N225", name: "Nikkei 225", kind: "index", currency: "JPY", detail: "Japan" },
];

export const FX: Instrument[] = [
  { symbol: "GBPUSD=X", name: "GBP/USD", kind: "fx", detail: "US dollars per pound" },
  { symbol: "GBPEUR=X", name: "GBP/EUR", kind: "fx", detail: "Euros per pound" },
  { symbol: "JPY=X", name: "USD/JPY", kind: "fx", detail: "Yen per US dollar" },
];

export const COMMODITIES: Instrument[] = [
  {
    symbol: "BZ=F",
    name: "Brent crude",
    kind: "commodity",
    currency: "USD",
    detail: "Front-month future, $ per barrel",
  },
  {
    symbol: "GC=F",
    name: "Gold",
    kind: "commodity",
    currency: "USD",
    detail: "Front-month future, $ per troy oz",
  },
];

/** Bank of England series IUDMNPY: 10-year nominal par yield, daily. */
export const UK_10Y_GILT: Instrument = {
  symbol: "UK10Y",
  name: "UK 10-year gilt yield",
  kind: "yield",
  detail: "Bank of England, daily (published with a short lag)",
  feed: "boe",
  ranges: ["1W", "1M", "1Y"],
};

export const RATES: Instrument[] = [UK_10Y_GILT];

export const DASHBOARD_INSTRUMENTS: Instrument[] = [...INDICES, ...FX, ...COMMODITIES, ...RATES];

const BY_SYMBOL = new Map(DASHBOARD_INSTRUMENTS.map((i) => [i.symbol, i]));

export function findInstrument(symbol: string): Instrument | undefined {
  return BY_SYMBOL.get(symbol);
}

/**
 * Default watchlist for a first run. Just tickers - the user edits this freely.
 * A mix of FTSE 100 names, a FTSE 100 ETF and a US mega cap.
 */
export const DEFAULT_WATCHLIST: Array<Pick<Instrument, "symbol" | "name" | "kind" | "currency">> = [
  { symbol: "HSBA.L", name: "HSBC Holdings", kind: "stock", currency: "GBp" },
  { symbol: "AZN.L", name: "AstraZeneca", kind: "stock", currency: "GBp" },
  { symbol: "SHEL.L", name: "Shell", kind: "stock", currency: "GBp" },
  { symbol: "ULVR.L", name: "Unilever", kind: "stock", currency: "GBp" },
  { symbol: "ISF.L", name: "iShares Core FTSE 100 ETF", kind: "etf", currency: "GBp" },
  { symbol: "AAPL", name: "Apple", kind: "stock", currency: "USD" },
];

/** Symbols must look like tickers. Guards every route that takes a symbol. */
export const SYMBOL_PATTERN = /^[A-Za-z0-9^.=\-]{1,20}$/;

export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_PATTERN.test(symbol);
}
