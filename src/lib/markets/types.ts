// Shared market-data types. Used by server code (providers, routes) and
// client components alike, so keep this file free of Node-only imports.

export type InstrumentKind = "index" | "fx" | "commodity" | "stock" | "etf" | "yield";

export type ChartRange = "1D" | "1W" | "1M" | "1Y";
export const CHART_RANGES: ChartRange[] = ["1D", "1W", "1M", "1Y"];

/** Where a number came from. Every payload the UI shows carries one of these. */
export type DataSource = "yahoo" | "twelvedata" | "boe" | "ons" | "fred" | "treasury" | "sample";

export const SOURCE_LABELS: Record<DataSource, string> = {
  yahoo: "Yahoo Finance",
  twelvedata: "Twelve Data",
  boe: "Bank of England",
  ons: "ONS",
  fred: "FRED",
  treasury: "US Treasury",
  sample: "Sample data",
};

export interface Instrument {
  /** Yahoo-style symbol, e.g. "^FTSE", "GBPUSD=X", "HSBA.L". Our internal id. */
  symbol: string;
  name: string;
  kind: InstrumentKind;
  /** Quote currency if known ("GBP", "USD", "GBp" = pence). */
  currency?: string;
  /** Short extra context shown under the name, e.g. "Front-month future, $/barrel". */
  detail?: string;
  /** Which backend supplies it. Defaults to the configured market provider. */
  feed?: "market" | "boe";
  /** Ranges that make sense for this instrument (daily-only series skip 1D). */
  ranges?: ChartRange[];
}

export interface Quote {
  symbol: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  /** Percent units: -0.275 means -0.275%. */
  changePct: number | null;
  currency: string | null;
  /** ISO time of the last price, when the source provides one. */
  asOf: string | null;
  /** Recent intraday closes for a sparkline (may be empty). */
  spark: number[];
}

/** Provenance attached to every result sent to the browser. */
export interface Provenance {
  source: DataSource;
  /** When WE fetched it from upstream (ISO). This is the "last updated" time. */
  fetchedAt: string;
  isSample: boolean;
  /** True when upstream failed and this is the last good copy from cache. */
  stale?: boolean;
  /** Human-readable explanation, e.g. why sample data is showing. */
  note?: string;
}

export interface QuoteResult extends Provenance {
  quote: Quote;
}

export interface QuotesResponse {
  provider: DataSource;
  quotes: Record<string, QuoteResult>;
}

export interface HistoryPoint {
  /** Epoch milliseconds. */
  t: number;
  v: number;
}

export interface HistoryResponse extends Provenance {
  symbol: string;
  range: ChartRange;
  currency: string | null;
  points: HistoryPoint[];
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  currency: string | null;
  kind: InstrumentKind;
}
