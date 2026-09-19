import { describe, expect, it } from "vitest";
import { downsample, parseChart, parseSparkEntry } from "./yahoo";

// Fixtures mirror the real response shapes observed on 2026-09-19.

describe("parseSparkEntry", () => {
  it("matches Yahoo's published change using previousClose (FTSE 100, 18 Sep 2026)", () => {
    const quote = parseSparkEntry("^FTSE", {
      timestamp: [1789714800, 1789715100, 1789715400],
      close: [10700, 10663.65, 10659.13],
      previousClose: 10688.5,
      chartPreviousClose: 10688.5,
      fulldayPrice: 10659.13,
      fulldayChange: -29.37,
      fulldayChangePercent: -0.275,
    });
    expect(quote?.price).toBe(10659.13);
    expect(quote?.previousClose).toBe(10688.5);
    expect(quote?.change).toBeCloseTo(-29.37, 6);
    expect(quote?.changePct).toBeCloseTo(-0.275, 3);
    expect(quote?.asOf).toBe(new Date(1789715400 * 1000).toISOString());
  });

  it("ignores extended-hours fulldayPrice so price and change agree (AAPL, 18 Sep 2026)", () => {
    const quote = parseSparkEntry("AAPL", {
      timestamp: [1, 2, 3],
      close: [336.155, 335.59, 336.13],
      previousClose: 337,
      fulldayPrice: 334.8, // extended hours - not the regular close
      fulldayChange: -0.87,
      fulldayChangePercent: -0.258,
    });
    expect(quote?.price).toBe(336.13);
    expect(quote?.change).toBeCloseTo(-0.87, 6);
    expect(quote?.changePct).toBeCloseTo(-0.258, 3);
  });

  it("skips trailing null closes (FX and futures)", () => {
    const quote = parseSparkEntry("GBPUSD=X", {
      timestamp: [1, 2, 3, 4],
      close: [1.335, 1.3393, null, null],
      previousClose: 1.3358,
    });
    expect(quote?.price).toBe(1.3393);
    expect(quote?.spark).toEqual([1.335, 1.3393]);
    expect(quote?.asOf).toBe(new Date(2000).toISOString());
    expect(quote?.change).toBeCloseTo(0.0035, 10);
    expect(quote?.changePct).toBeCloseTo((0.0035 / 1.3358) * 100, 6);
  });

  it("returns null when there is no usable price", () => {
    expect(parseSparkEntry("X", undefined)).toBeNull();
    expect(parseSparkEntry("X", { timestamp: [1], close: [null] })).toBeNull();
  });

  it("leaves change empty rather than guessing when previous close is missing", () => {
    const quote = parseSparkEntry("X", { timestamp: [1], close: [5] });
    expect(quote).toMatchObject({ price: 5, previousClose: null, change: null, changePct: null });
  });
});

describe("parseChart", () => {
  it("converts to millisecond points and drops nulls", () => {
    const { points, meta } = parseChart({
      chart: {
        result: [
          {
            meta: { currency: "GBp", symbol: "VOD.L" },
            timestamp: [100, 200, 300],
            indicators: { quote: [{ close: [126.1, null, 126.15] }] },
          },
        ],
        error: null,
      },
    });
    expect(meta.currency).toBe("GBp");
    expect(points).toEqual([
      { t: 100_000, v: 126.1 },
      { t: 300_000, v: 126.15 },
    ]);
  });

  it("throws Yahoo's error description", () => {
    expect(() =>
      parseChart({
        chart: { result: null, error: { code: "Not Found", description: "No data found, symbol may be delisted" } },
      }),
    ).toThrow(/No data found/);
  });
});

describe("downsample", () => {
  it("keeps first and last and caps the length", () => {
    const values = Array.from({ length: 101 }, (_, i) => i);
    const out = downsample(values, 11);
    expect(out).toHaveLength(11);
    expect(out[0]).toBe(0);
    expect(out.at(-1)).toBe(100);
  });

  it("returns short arrays untouched", () => {
    expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
  });
});
