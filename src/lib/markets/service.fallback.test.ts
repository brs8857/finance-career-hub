import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketProvider } from "./providers/provider";
import type { Quote } from "./types";

// The "never invent data" guarantee: when upstream fails, every result is
// either a real cached copy (flagged stale) or labelled sample data.

const state = vi.hoisted(() => ({ provider: null as MarketProvider | null }));

vi.mock("./providers", () => ({ activeProvider: () => state.provider }));
vi.mock("@/lib/cache", async () => {
  const { createCache } = await vi.importActual<typeof import("@/lib/cache")>("@/lib/cache");
  const cache = createCache(mkdtempSync(path.join(tmpdir(), "fch-svc-")));
  return { cached: cache.cached, readCache: cache.read, writeCache: cache.write };
});
vi.mock("@/lib/macro/boe", () => ({
  fetchBoeSeries: async () => {
    throw new Error("BoE down");
  },
}));

const { getQuotes, getHistory } = await import("./service");

function quote(symbol: string, price: number): Quote {
  return { symbol, price, previousClose: price, change: 0, changePct: 0, currency: null, asOf: null, spark: [] };
}

function fakeProvider(getQuotes: MarketProvider["getQuotes"]): MarketProvider {
  return {
    name: "yahoo",
    quoteTtlSeconds: 0, // expire immediately so every call refetches
    getQuotes,
    getHistory: async () => {
      throw new Error("history down");
    },
    lookup: async () => null,
  };
}

beforeEach(() => {
  state.provider = null;
});

describe("getQuotes fallbacks", () => {
  it("labels everything as sample in sample mode", async () => {
    const res = await getQuotes(["^FTSE", "AAPL"]);
    expect(res.provider).toBe("sample");
    expect(Object.values(res.quotes).every((r) => r.isSample && r.source === "sample" && r.note)).toBe(true);
  });

  it("returns real data when the provider works", async () => {
    state.provider = fakeProvider(async (symbols) => new Map(symbols.map((s) => [s, quote(s, 42)])));
    const res = await getQuotes(["^GSPC"]);
    expect(res.quotes["^GSPC"]).toMatchObject({ source: "yahoo", isSample: false, quote: { price: 42 } });
  });

  it("serves the last real copy flagged stale when the provider then fails", async () => {
    state.provider = fakeProvider(async (symbols) => new Map(symbols.map((s) => [s, quote(s, 7)])));
    await getQuotes(["^N225"]);
    state.provider = fakeProvider(async () => {
      throw new Error("Yahoo HTTP 404");
    });
    const res = await getQuotes(["^N225"]);
    expect(res.quotes["^N225"]).toMatchObject({ isSample: false, stale: true, quote: { price: 7 } });
    expect(res.quotes["^N225"].note).toMatch(/Yahoo HTTP 404/);
  });

  it("falls back to labelled sample data when there's no copy at all", async () => {
    state.provider = fakeProvider(async () => {
      throw new Error("Yahoo HTTP 404");
    });
    const res = await getQuotes(["^GDAXI"]);
    expect(res.quotes["^GDAXI"]).toMatchObject({ isSample: true, source: "sample" });
    expect(res.quotes["^GDAXI"].note).toMatch(/Couldn't reach Yahoo Finance/);
  });

  it("marks symbols the provider silently omits as sample, with a reason", async () => {
    state.provider = fakeProvider(async () => new Map([["AAPL", quote("AAPL", 1)]]));
    const res = await getQuotes(["AAPL", "NOPE.L"]);
    expect(res.quotes.AAPL.isSample).toBe(false);
    expect(res.quotes["NOPE.L"]).toMatchObject({ isSample: true, note: "Yahoo Finance returned no data for this symbol." });
  });

  it("labels the gilt as sample when the Bank of England is unreachable", async () => {
    const res = await getQuotes(["UK10Y"]);
    expect(res.quotes.UK10Y).toMatchObject({ isSample: true });
    expect(res.quotes.UK10Y.note).toMatch(/Bank of England/);
  });
});

describe("getHistory fallbacks", () => {
  it("labels history as sample when the provider fails", async () => {
    state.provider = fakeProvider(async () => new Map());
    const res = await getHistory("^FTSE", "1M");
    expect(res).toMatchObject({ isSample: true, source: "sample" });
    expect(res.note).toMatch(/history down/);
    expect(res.points.length).toBeGreaterThan(1);
  });
});
