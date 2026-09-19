import type { ChartRange, DataSource, HistoryPoint, Quote, SymbolInfo } from "../types";

/**
 * What every market-data provider must implement. To add a provider, write a
 * file in this folder that exports one of these and register it in index.ts.
 *
 * Rules:
 * - Return only real data from the upstream API. Never fill gaps with guesses.
 * - getQuotes: symbols the provider can't supply are simply left out of the map;
 *   the service layer marks those as sample data with an explanation.
 * - Throw on network / API failure; the service layer handles fallbacks.
 */
export interface MarketProvider {
  name: DataSource;
  /** How long quotes stay fresh in the cache. Slower tiers use longer TTLs. */
  quoteTtlSeconds: number;
  getQuotes(symbols: string[]): Promise<Map<string, Quote>>;
  getHistory(symbol: string, range: ChartRange): Promise<{ points: HistoryPoint[]; currency: string | null }>;
  /** Check a ticker exists and fetch its name/currency. null = not found. */
  lookup(symbol: string): Promise<SymbolInfo | null>;
  /** Optional: explain why a symbol is unavailable on this provider. */
  unsupportedReason?(symbol: string): string | null;
}
