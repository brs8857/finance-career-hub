import { describe, expect, it } from "vitest";
import type { QuoteResult } from "@/lib/markets/types";
import type { WatchlistItem } from "@/lib/store/collections";
import { rankMovers } from "./TopMovers";

const item = (symbol: string): WatchlistItem => ({ symbol, name: symbol, kind: "stock", currency: "GBp" });
const result = (changePct: number | null, isSample = false): QuoteResult => ({
  source: isSample ? "sample" : "yahoo",
  fetchedAt: "2026-09-19T12:00:00Z",
  isSample,
  quote: { symbol: "X", price: 1, previousClose: 1, change: 0, changePct, currency: null, asOf: null, spark: [] },
});

describe("rankMovers", () => {
  it("ranks risers and fallers and never counts sample data as a real move", () => {
    const items = ["A", "B", "C", "D", "E"].map(item);
    const quotes = { A: result(2.5), B: result(-1), C: result(0.4), D: result(9, true), E: result(-3) };
    const { gainers, losers, excluded } = rankMovers(items, quotes);
    expect(gainers.map((m) => m.item.symbol)).toEqual(["A", "C"]);
    expect(losers.map((m) => m.item.symbol)).toEqual(["E", "B"]);
    expect(excluded).toBe(1);
  });

  it("treats a missing change as excluded, not as zero", () => {
    const { gainers, losers, excluded } = rankMovers([item("A")], { A: result(null) });
    expect(gainers).toEqual([]);
    expect(losers).toEqual([]);
    expect(excluded).toBe(1);
  });
});
